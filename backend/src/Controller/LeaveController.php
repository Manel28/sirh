<?php

namespace App\Controller;

use App\Entity\Leave;
use App\Repository\LeaveRepository;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

class LeaveController
{
    #[Route('/api/leaves', name: 'api_leaves_list', methods: ['GET'])]
    public function getLeaves(
        Request $request,
        LeaveRepository $leaveRepository,
        UserRepository $userRepository
    ): JsonResponse {
        try {
            $userId = $request->query->get('userId');
            $roles = $request->query->all('roles');

            if (!$userId) {
                return new JsonResponse(['message' => 'Missing userId'], 400);
            }

            $user = $userRepository->find($userId);

            if (!$user) {
                return new JsonResponse(['message' => 'User not found'], 404);
            }

            $isAdmin = in_array('ROLE_ADMIN', $roles, true);

            if ($isAdmin) {
                $leaves = $leaveRepository->findBy([], ['id' => 'DESC']);
            } else {
                $leaves = $leaveRepository->findBy(['user' => $user], ['id' => 'DESC']);
            }

            $data = array_map(function (Leave $leave) {
                return [
                    'id' => $leave->getId(),
                    'type' => $leave->getType(),
                    'start' => $leave->getStartDate()?->format('Y-m-d'),
                    'end' => $leave->getEndDate()?->format('Y-m-d'),
                    'status' => $leave->getStatus(),
                    'user' => [
                        'id' => $leave->getUser()?->getId(),
                        'email' => $leave->getUser()?->getEmail(),
                    ],
                ];
            }, $leaves);

            return new JsonResponse($data, 200);
        } catch (\Throwable $e) {
            return new JsonResponse([
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ], 500);
        }
    }

    #[Route('/api/leaves', name: 'api_leaves_create', methods: ['POST'])]
    public function createLeave(
        Request $request,
        EntityManagerInterface $entityManager,
        UserRepository $userRepository
    ): JsonResponse {
        try {
            $data = json_decode($request->getContent(), true);

            if (
                !$data ||
                !isset($data['type']) ||
                !isset($data['start']) ||
                !isset($data['end']) ||
                !isset($data['userId'])
            ) {
                return new JsonResponse(['message' => 'Invalid data'], 400);
            }

            $user = $userRepository->find($data['userId']);

            if (!$user) {
                return new JsonResponse(['message' => 'User not found'], 404);
            }

            $leave = new Leave();
            $leave->setType($data['type']);
            $leave->setStartDate(new \DateTime($data['start']));
            $leave->setEndDate(new \DateTime($data['end']));
            $leave->setStatus('Pending');
            $leave->setUser($user);

            $entityManager->persist($leave);
            $entityManager->flush();

            return new JsonResponse([
                'message' => 'Leave request created successfully',
                'leave' => [
                    'id' => $leave->getId(),
                    'type' => $leave->getType(),
                    'start' => $leave->getStartDate()?->format('Y-m-d'),
                    'end' => $leave->getEndDate()?->format('Y-m-d'),
                    'status' => $leave->getStatus(),
                    'user' => [
                        'id' => $leave->getUser()?->getId(),
                        'email' => $leave->getUser()?->getEmail(),
                    ],
                ]
            ], 201);
        } catch (\Throwable $e) {
            return new JsonResponse([
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ], 500);
        }
    }

    #[Route('/api/leaves/{id}/status', name: 'api_leaves_status_update', methods: ['PATCH'])]
    public function updateLeaveStatus(
        int $id,
        Request $request,
        LeaveRepository $leaveRepository,
        EntityManagerInterface $entityManager
    ): JsonResponse {
        try {
            $leave = $leaveRepository->find($id);

            if (!$leave) {
                return new JsonResponse(['message' => 'Leave not found'], 404);
            }

            $data = json_decode($request->getContent(), true);

            if (!$data || !isset($data['status'])) {
                return new JsonResponse(['message' => 'Missing status'], 400);
            }

            $allowedStatuses = ['Pending', 'Approved', 'Rejected', 'Cancelled'];

            if (!in_array($data['status'], $allowedStatuses, true)) {
                return new JsonResponse(['message' => 'Invalid status'], 400);
            }

            $leave->setStatus($data['status']);
            $entityManager->flush();

            return new JsonResponse([
                'message' => 'Leave status updated successfully',
                'leave' => [
                    'id' => $leave->getId(),
                    'type' => $leave->getType(),
                    'start' => $leave->getStartDate()?->format('Y-m-d'),
                    'end' => $leave->getEndDate()?->format('Y-m-d'),
                    'status' => $leave->getStatus(),
                    'user' => [
                        'id' => $leave->getUser()?->getId(),
                        'email' => $leave->getUser()?->getEmail(),
                    ],
                ]
            ], 200);
        } catch (\Throwable $e) {
            return new JsonResponse([
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ], 500);
        }
    }
}