<?php

namespace App\Controller;

use App\Entity\Leave;
use App\Entity\Notification;
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
                return new JsonResponse(['message' => 'Missing user.'], 400);
            }

            $user = $userRepository->find($userId);

            if (!$user) {
                return new JsonResponse(['message' => 'User not found.'], 404);
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
                'message' => 'Server error while loading leave requests.',
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
                return new JsonResponse(['message' => 'Missing required fields.'], 400);
            }

            $user = $userRepository->find($userId);

            if (!$user) {
                return new JsonResponse(['message' => 'User not found.'], 404);
            }

            $startDate = new \DateTime($start);
            $endDate = new \DateTime($end);
            $today = new \DateTime('today');

            if ($startDate < $today || $endDate < $today) {
                return new JsonResponse(['message' => 'The selected date cannot be in the past.'], 400);
            }

            if ($endDate < $startDate) {
                return new JsonResponse(['message' => 'End date cannot be earlier than start date.'], 400);
            }

            if ($leaveRepository->hasOverlappingLeave($user, $startDate, $endDate)) {
                return new JsonResponse(['message' => 'You already have a leave request for this period.'], 400);
            }

            $requestedDays = $this->countWorkingDays($startDate, $endDate);

            if ($requestedDays <= 0) {
                return new JsonResponse(['message' => 'The leave request must include at least one working day.'], 400);
            }

            if ($type === 'Paid Leave' && $user->getLeaveBalance() < $requestedDays) {
                return new JsonResponse(['message' => 'Insufficient leave balance.'], 400);
            }

            $leave = new Leave();
            $leave->setType($type);
            $leave->setStartDate($startDate);
            $leave->setEndDate($endDate);
            $leave->setStatus('Pending');
            $leave->setUser($user);

            $entityManager->persist($leave);

            $admins = $userRepository->createQueryBuilder('u')
                ->where('u.roles LIKE :role')
                ->setParameter('role', '%ROLE_ADMIN%')
                ->getQuery()
                ->getResult();

            foreach ($admins as $admin) {
                $this->createNotification(
                    $entityManager,
                    $admin,
                    'New leave request',
                    sprintf(
                        '%s submitted a new %s request from %s to %s.',
                        trim(($user->getFirstName() ?? '') . ' ' . ($user->getLastName() ?? '')) ?: $user->getEmail(),
                        $type,
                        $startDate->format('Y-m-d'),
                        $endDate->format('Y-m-d')
                    ),
                    'leave'
                );
            }

            $entityManager->flush();

            return new JsonResponse([
                'message' => 'Leave request created successfully.',
                'leave' => $this->formatLeave($leave),
                'leaveBalance' => $user->getLeaveBalance(),
            ], 201);
        } catch (\Throwable $e) {
            return new JsonResponse([
                'message' => 'Server error while creating leave request.',
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
                return new JsonResponse(['message' => 'Leave request not found.'], 404);
            }

            $data = json_decode($request->getContent(), true);
            $newStatus = $data['status'] ?? null;

            if (!in_array($newStatus, ['Approved', 'Rejected', 'Cancelled'], true)) {
                return new JsonResponse(['message' => 'Invalid status.'], 400);
            }

            if ($leave->getStatus() !== 'Pending') {
                return new JsonResponse(['message' => 'This request has already been processed.'], 400);
            }

            $user = $leave->getUser();

            if (!$user) {
                return new JsonResponse(['message' => 'Leave request user not found.'], 404);
            }

            if ($newStatus === 'Approved' && $leave->getType() === 'Paid Leave') {
                $requestedDays = $this->countWorkingDays(
                    $leave->getStartDate(),
                    $leave->getEndDate()
                );

                if ($user->getLeaveBalance() < $requestedDays) {
                    return new JsonResponse([
                        'message' => 'Insufficient leave balance to approve this request.',
                    ], 400);
                }

                $user->setLeaveBalance($user->getLeaveBalance() - $requestedDays);
            }

            $leave->setStatus($newStatus);

            $this->createNotification(
                $entityManager,
                $user,
                'Leave request updated',
                sprintf(
                    'Your %s request from %s to %s has been %s.',
                    $leave->getType(),
                    $leave->getStartDate()?->format('Y-m-d'),
                    $leave->getEndDate()?->format('Y-m-d'),
                    strtolower($newStatus)
                ),
                'leave'
            );

            $entityManager->flush();

            return new JsonResponse([
                'message' => 'Leave request status updated successfully.',
                'leave' => $this->formatLeave($leave),
                'leaveBalance' => $user->getLeaveBalance(),
            ], 200);
        } catch (\Throwable $e) {
            return new JsonResponse([
                'message' => 'Server error while updating leave status.',
                'error' => $e->getMessage(),
                'line' => $e->getLine(),
            ], 500);
        }
    }

    private function createNotification(
        EntityManagerInterface $entityManager,
        $user,
        string $title,
        string $message,
        string $type
    ): void {
        $notification = new Notification();
        $notification->setUser($user);
        $notification->setTitle($title);
        $notification->setMessage($message);
        $notification->setType($type);
        $notification->setIsRead(false);
        $notification->setCreatedAt(new \DateTime());

        $entityManager->persist($notification);
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