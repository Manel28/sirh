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
    #[Route('/api/leaves', methods: ['GET'])]
    public function getLeaves(
        Request $request,
        LeaveRepository $leaveRepository,
        UserRepository $userRepository
    ): JsonResponse {
        try {
            $userId = $request->query->get('userId');
            $roles = $request->query->all('roles');

            if (!$userId) {
                return new JsonResponse(['message' => 'Utilisateur manquant.'], 400);
            }

            $user = $userRepository->find($userId);

            if (!$user) {
                return new JsonResponse(['message' => 'Utilisateur introuvable.'], 404);
            }

            $isAdmin = in_array('ROLE_ADMIN', $roles, true);

            $leaves = $isAdmin
                ? $leaveRepository->findBy([], ['id' => 'DESC'])
                : $leaveRepository->findBy(['user' => $user], ['id' => 'DESC']);

            return new JsonResponse([
                'leaveBalance' => $user->getLeaveBalance(),
                'leaves' => array_map(fn(Leave $leave) => $this->formatLeave($leave), $leaves),
            ], 200);
        } catch (\Throwable $e) {
            return new JsonResponse([
                'message' => 'Erreur serveur lors du chargement des congés.',
                'error' => $e->getMessage(),
                'line' => $e->getLine(),
            ], 500);
        }
    }

    #[Route('/api/leaves', methods: ['POST'])]
    public function createLeave(
        Request $request,
        EntityManagerInterface $entityManager,
        UserRepository $userRepository,
        LeaveRepository $leaveRepository
    ): JsonResponse {
        try {
            $data = json_decode($request->getContent(), true);

            $type = $data['type'] ?? null;
            $start = $data['start'] ?? null;
            $end = $data['end'] ?? null;
            $userId = $data['userId'] ?? null;

            if (!$type || !$start || !$end || !$userId) {
                return new JsonResponse(['message' => 'Champs manquants.'], 400);
            }

            $user = $userRepository->find($userId);

            if (!$user) {
                return new JsonResponse(['message' => 'Utilisateur introuvable.'], 404);
            }

            $startDate = new \DateTime($start);
            $endDate = new \DateTime($end);
            $today = new \DateTime('today');

            if ($startDate < $today || $endDate < $today) {
                return new JsonResponse(['message' => 'La date ne peut pas être dans le passé.'], 400);
            }

            if ($endDate < $startDate) {
                return new JsonResponse(['message' => 'La date de fin ne peut pas être avant la date de début.'], 400);
            }

            if ($leaveRepository->hasOverlappingLeave($user, $startDate, $endDate)) {
                return new JsonResponse(['message' => 'Vous avez déjà une demande de congé sur cette période.'], 400);
            }

            $requestedDays = $this->countWorkingDays($startDate, $endDate);

            if ($requestedDays <= 0) {
                return new JsonResponse(['message' => 'La demande doit contenir au moins un jour ouvré.'], 400);
            }

            if ($type === 'Paid Leave' && $user->getLeaveBalance() < $requestedDays) {
                return new JsonResponse(['message' => 'Solde de congés insuffisant.'], 400);
            }

            $leave = new Leave();
            $leave->setType($type);
            $leave->setStartDate($startDate);
            $leave->setEndDate($endDate);
            $leave->setStatus('Pending');
            $leave->setUser($user);

            $entityManager->persist($leave);
            $entityManager->flush();

            return new JsonResponse([
                'message' => 'Demande de congé ajoutée avec succès.',
                'leave' => $this->formatLeave($leave),
                'leaveBalance' => $user->getLeaveBalance(),
            ], 201);
        } catch (\Throwable $e) {
            return new JsonResponse([
                'message' => 'Erreur serveur lors de la création du congé.',
                'error' => $e->getMessage(),
                'line' => $e->getLine(),
            ], 500);
        }
    }

    #[Route('/api/leaves/{id}/status', methods: ['PATCH'])]
    public function updateLeaveStatus(
        int $id,
        Request $request,
        LeaveRepository $leaveRepository,
        EntityManagerInterface $entityManager
    ): JsonResponse {
        try {
            $leave = $leaveRepository->find($id);

            if (!$leave) {
                return new JsonResponse(['message' => 'Demande introuvable.'], 404);
            }

            $data = json_decode($request->getContent(), true);
            $newStatus = $data['status'] ?? null;

            if (!in_array($newStatus, ['Approved', 'Rejected', 'Cancelled'], true)) {
                return new JsonResponse(['message' => 'Statut invalide.'], 400);
            }

            if ($leave->getStatus() !== 'Pending') {
                return new JsonResponse(['message' => 'Cette demande est déjà traitée.'], 400);
            }

            $user = $leave->getUser();

            if (!$user) {
                return new JsonResponse(['message' => 'Utilisateur du congé introuvable.'], 404);
            }

            if ($newStatus === 'Approved' && $leave->getType() === 'Paid Leave') {
                $requestedDays = $this->countWorkingDays(
                    $leave->getStartDate(),
                    $leave->getEndDate()
                );

                if ($user->getLeaveBalance() < $requestedDays) {
                    return new JsonResponse([
                        'message' => 'Solde de congés insuffisant pour approuver cette demande.',
                    ], 400);
                }

                $user->setLeaveBalance($user->getLeaveBalance() - $requestedDays);
            }

            $leave->setStatus($newStatus);
            $entityManager->flush();

            return new JsonResponse([
                'message' => 'Statut mis à jour avec succès.',
                'leave' => $this->formatLeave($leave),
                'leaveBalance' => $user->getLeaveBalance(),
            ], 200);
        } catch (\Throwable $e) {
            return new JsonResponse([
                'message' => 'Erreur serveur lors de la mise à jour du statut.',
                'error' => $e->getMessage(),
                'line' => $e->getLine(),
            ], 500);
        }
    }

    private function countWorkingDays(\DateTimeInterface $startDate, \DateTimeInterface $endDate): int
    {
        $count = 0;
        $current = clone $startDate;

        while ($current <= $endDate) {
            if ((int) $current->format('N') < 6) {
                $count++;
            }

            $current->modify('+1 day');
        }

        return $count;
    }

    private function formatLeave(Leave $leave): array
    {
        return [
            'id' => $leave->getId(),
            'type' => $leave->getType(),
            'start' => $leave->getStartDate()?->format('Y-m-d'),
            'end' => $leave->getEndDate()?->format('Y-m-d'),
            'status' => $leave->getStatus(),
            'user' => [
                'id' => $leave->getUser()?->getId(),
                'email' => $leave->getUser()?->getEmail(),
                'firstName' => $leave->getUser()?->getFirstName(),
                'lastName' => $leave->getUser()?->getLastName(),
                'leaveBalance' => $leave->getUser()?->getLeaveBalance(),
            ],
        ];
    }
}