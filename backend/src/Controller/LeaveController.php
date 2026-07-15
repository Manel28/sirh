<?php

namespace App\Controller;

use App\Entity\Leave;
use App\Entity\Notification;
use App\Entity\User;
use App\Repository\LeaveRepository;
use App\Repository\UserRepository;
use App\Service\LeaveDurationCalculator;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;

/**
 * Gere le cycle complet d'une demande de conge : creation, validation et notification.
 */
class LeaveController
{
    // Liste blanche des types acceptes par le backend, independamment du formulaire React.
    private const LEAVE_TYPES = [
        'Paid Leave',
        'Unpaid Leave',
        'Special Event Leave',
        'JNT',
        'Sick Leave',
        'Half-day Morning',
        'Half-day Afternoon',
        'Other Absence',
    ];

    public function __construct(
        private readonly LeaveDurationCalculator $leaveDurationCalculator
    ) {
    }

    #[Route('/api/leaves', methods: ['GET'])]
    public function getLeaves(
        #[CurrentUser] User $user,
        LeaveRepository $leaveRepository
    ): JsonResponse {
        // Un RH voit toutes les demandes ; un collaborateur ne voit que les siennes.
        $leaves = in_array('ROLE_ADMIN', $user->getRoles(), true)
            ? $leaveRepository->findBy([], ['id' => 'DESC'])
            : $leaveRepository->findBy(['user' => $user], ['id' => 'DESC']);

        return new JsonResponse([
            'leaveBalance' => $user->getLeaveBalance(),
            'leaves' => array_map(
                fn (Leave $leave) => $this->formatLeave($leave),
                $leaves
            ),
        ]);
    }

    #[Route('/api/leaves', methods: ['POST'])]
    public function createLeave(
        #[CurrentUser] User $user,
        Request $request,
        EntityManagerInterface $entityManager,
        UserRepository $userRepository,
        LeaveRepository $leaveRepository
    ): JsonResponse {
        try {
            // Lecture du JSON puis verification des champs et des valeurs autorisees.
            $data = json_decode($request->getContent(), true);
            $type = is_array($data) ? (string) ($data['type'] ?? '') : '';
            $start = is_array($data) ? (string) ($data['start'] ?? '') : '';
            $end = is_array($data) ? (string) ($data['end'] ?? '') : '';

            if ($type === '' || $start === '' || $end === '') {
                return new JsonResponse(['message' => 'Missing required fields.'], 400);
            }

            if (!in_array($type, self::LEAVE_TYPES, true)) {
                return new JsonResponse(['message' => 'Invalid leave type.'], 400);
            }

            $startDate = \DateTime::createFromFormat('!Y-m-d', $start);
            $endDate = \DateTime::createFromFormat('!Y-m-d', $end);

            if (
                !$startDate || !$endDate ||
                $startDate->format('Y-m-d') !== $start ||
                $endDate->format('Y-m-d') !== $end
            ) {
                return new JsonResponse(['message' => 'Invalid date format.'], 400);
            }

            $today = new \DateTime('today');

            if ($startDate < $today || $endDate < $today) {
                return new JsonResponse(['message' => 'The selected date cannot be in the past.'], 400);
            }

            if ($endDate < $startDate) {
                return new JsonResponse(['message' => 'End date cannot be earlier than start date.'], 400);
            }

            if ($leaveRepository->hasOverlappingLeave($user, $startDate, $endDate)) {
                return new JsonResponse([
                    'message' => 'You already have a leave request for this period.',
                ], 409);
            }

            // Le service metier compte uniquement les jours du lundi au vendredi.
            $requestedDays = $this->leaveDurationCalculator->countWorkingDays(
                $startDate,
                $endDate
            );

            if ($requestedDays <= 0) {
                return new JsonResponse([
                    'message' => 'The leave request must include at least one working day.',
                ], 400);
            }

            if ($type === 'Paid Leave' && $user->getLeaveBalance() < $requestedDays) {
                return new JsonResponse(['message' => 'Insufficient leave balance.'], 400);
            }

            // Toute nouvelle demande est creee avec le statut Pending.
            $leave = (new Leave())
                ->setType($type)
                ->setStartDate($startDate)
                ->setEndDate($endDate)
                ->setStatus('Pending')
                ->setUser($user);

            $entityManager->persist($leave);

            // Chaque responsable RH recoit une notification liee a la nouvelle demande.
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
                        trim(($user->getFirstName() ?? '') . ' ' . ($user->getLastName() ?? ''))
                            ?: $user->getEmail(),
                        $type,
                        $start,
                        $end
                    ),
                    'leave'
                );
            }

            // Un seul flush enregistre la demande et toutes les notifications preparees.
            $entityManager->flush();

            return new JsonResponse([
                'message' => 'Leave request created successfully.',
                'leave' => $this->formatLeave($leave),
                'leaveBalance' => $user->getLeaveBalance(),
            ], 201);
        } catch (\Throwable) {
            return new JsonResponse(['message' => 'Server error while creating leave request.'], 500);
        }
    }

    #[Route('/api/leaves/{id}/status', methods: ['PATCH'])]
    public function updateLeaveStatus(
        int $id,
        #[CurrentUser] User $currentUser,
        Request $request,
        LeaveRepository $leaveRepository,
        EntityManagerInterface $entityManager
    ): JsonResponse {
        try {
            // Le repository retrouve l'entite a partir de l'id place dans l'URL.
            $leave = $leaveRepository->find($id);

            if (!$leave) {
                return new JsonResponse(['message' => 'Leave request not found.'], 404);
            }

            $data = json_decode($request->getContent(), true);
            $newStatus = is_array($data) ? ($data['status'] ?? null) : null;

            if (!in_array($newStatus, ['Approved', 'Rejected', 'Cancelled'], true)) {
                return new JsonResponse(['message' => 'Invalid status.'], 400);
            }

            if ($leave->getStatus() !== 'Pending') {
                return new JsonResponse(['message' => 'This request has already been processed.'], 409);
            }

            $owner = $leave->getUser();

            if (!$owner) {
                return new JsonResponse(['message' => 'Leave request user not found.'], 404);
            }

            $isAdmin = in_array('ROLE_ADMIN', $currentUser->getRoles(), true);

            // Seul le RH approuve/refuse ; le proprietaire peut uniquement annuler sa demande.
            if (in_array($newStatus, ['Approved', 'Rejected'], true) && !$isAdmin) {
                return new JsonResponse(['message' => 'Administrator access required.'], 403);
            }

            if (
                $newStatus === 'Cancelled' &&
                !$isAdmin &&
                $owner->getId() !== $currentUser->getId()
            ) {
                return new JsonResponse(['message' => 'You cannot cancel this request.'], 403);
            }

            if ($newStatus === 'Approved' && $leave->getType() === 'Paid Leave') {
                // Le solde est debite seulement au moment de l'approbation du conge paye.
                $requestedDays = $this->leaveDurationCalculator->countWorkingDays(
                    $leave->getStartDate(),
                    $leave->getEndDate()
                );

                if ($owner->getLeaveBalance() < $requestedDays) {
                    return new JsonResponse([
                        'message' => 'Insufficient leave balance to approve this request.',
                    ], 400);
                }

                $owner->setLeaveBalance($owner->getLeaveBalance() - $requestedDays);
            }

            $leave->setStatus($newStatus);

            // Le collaborateur est informe du nouveau statut dans l'application.
            $this->createNotification(
                $entityManager,
                $owner,
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
                'leaveBalance' => $owner->getLeaveBalance(),
            ]);
        } catch (\Throwable) {
            return new JsonResponse(['message' => 'Server error while updating leave status.'], 500);
        }
    }

    private function createNotification(
        EntityManagerInterface $entityManager,
        User $user,
        string $title,
        string $message,
        string $type
    ): void {
        // persist prepare l'INSERT ; le controleur appelant effectue ensuite le flush commun.
        $notification = (new Notification())
            ->setUser($user)
            ->setTitle($title)
            ->setMessage($message)
            ->setType($type)
            ->setIsRead(false)
            ->setCreatedAt(new \DateTime());

        $entityManager->persist($notification);
    }

    private function formatLeave(Leave $leave): array
    {
        // Normalise l'entite et ses dates avant la reponse JSON envoyee a React.
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
