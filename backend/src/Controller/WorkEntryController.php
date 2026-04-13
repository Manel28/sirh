<?php

namespace App\Controller;

use App\Entity\WorkEntry;
use App\Repository\LeaveRepository;
use App\Repository\UserRepository;
use App\Repository\WorkEntryRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

class WorkEntryController
{
    #[Route('/api/work-entries', methods: ['GET'])]
    public function getWorkEntries(
        Request $request,
        WorkEntryRepository $workEntryRepository,
        LeaveRepository $leaveRepository
    ): JsonResponse {
        try {
            $month = $request->query->get('month'); // format: YYYY-MM

            if (!$month) {
                return new JsonResponse(['message' => 'Missing month'], 400);
            }

            $start = new \DateTime($month . '-01');
            $end = (clone $start)->modify('last day of this month');

            $entries = $workEntryRepository->createQueryBuilder('w')
                ->where('w.workDate BETWEEN :start AND :end')
                ->setParameter('start', $start)
                ->setParameter('end', $end)
                ->getQuery()
                ->getResult();

            $data = [];

            foreach ($entries as $entry) {
                $data[] = [
                    'id' => $entry->getId(),
                    'date' => $entry->getWorkDate()?->format('Y-m-d'),
                    'code' => $entry->getCode(),
                    'userId' => $entry->getUser()?->getId(),
                ];
            }

            // Inject approved leaves as LV into the calendar
            $approvedLeaves = $leaveRepository->createQueryBuilder('l')
                ->where('l.status = :status')
                ->andWhere('l.startDate <= :end')
                ->andWhere('l.endDate >= :start')
                ->setParameter('status', 'Approved')
                ->setParameter('start', $start)
                ->setParameter('end', $end)
                ->getQuery()
                ->getResult();

            $existingMap = [];
            foreach ($data as $row) {
                $existingMap[$row['userId'] . '_' . $row['date']] = true;
            }

            foreach ($approvedLeaves as $leave) {
                $leaveStart = $leave->getStartDate();
                $leaveEnd = $leave->getEndDate();
                $user = $leave->getUser();

                if (!$leaveStart || !$leaveEnd || !$user) {
                    continue;
                }

                $current = clone $leaveStart;
                while ($current <= $leaveEnd) {
                    $dateString = $current->format('Y-m-d');
                    $key = $user->getId() . '_' . $dateString;

                    // Leave overrides manual planning
                    $data = array_values(array_filter($data, function ($row) use ($key) {
                        return ($row['userId'] . '_' . $row['date']) !== $key;
                    }));

                    $data[] = [
                        'id' => null,
                        'date' => $dateString,
                        'code' => 'LV',
                        'userId' => $user->getId(),
                    ];

                    $current->modify('+1 day');
                }
            }

            usort($data, function ($a, $b) {
                return [$a['userId'], $a['date']] <=> [$b['userId'], $b['date']];
            });

            return new JsonResponse($data);
        } catch (\Throwable $e) {
            return new JsonResponse([
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    #[Route('/api/work-entries', methods: ['POST'])]
    public function saveWorkEntry(
        Request $request,
        EntityManagerInterface $entityManager,
        WorkEntryRepository $workEntryRepository,
        UserRepository $userRepository,
        LeaveRepository $leaveRepository
    ): JsonResponse {
        try {
            $data = json_decode($request->getContent(), true);

            if (
                !$data ||
                !isset($data['userId']) ||
                !isset($data['date']) ||
                !array_key_exists('code', $data)
            ) {
                return new JsonResponse(['message' => 'Invalid data'], 400);
            }

            $user = $userRepository->find($data['userId']);

            if (!$user) {
                return new JsonResponse(['message' => 'User not found'], 404);
            }

            $date = new \DateTime($data['date']);
            $code = strtoupper(trim((string) $data['code']));

            $allowedCodes = ['', 'SS', 'TT', 'TR', 'AB', 'LV'];
            if (!in_array($code, $allowedCodes, true)) {
                return new JsonResponse(['message' => 'Invalid code'], 400);
            }

            // If an approved leave exists on that date, force LV and block manual overwrite
            $approvedLeave = $leaveRepository->createQueryBuilder('l')
                ->where('l.user = :user')
                ->andWhere('l.status = :status')
                ->andWhere('l.startDate <= :date')
                ->andWhere('l.endDate >= :date')
                ->setParameter('user', $user)
                ->setParameter('status', 'Approved')
                ->setParameter('date', $date)
                ->getQuery()
                ->getOneOrNullResult();

            if ($approvedLeave) {
                return new JsonResponse([
                    'message' => 'This day is covered by an approved leave and is automatically set to LV.'
                ], 400);
            }

            $existing = $workEntryRepository->findOneBy([
                'user' => $user,
                'workDate' => $date,
            ]);

            // empty code = clear manual entry
            if ($code === '') {
                if ($existing) {
                    $entityManager->remove($existing);
                    $entityManager->flush();
                }

                return new JsonResponse([
                    'message' => 'Entry cleared successfully'
                ]);
            }

            if ($existing) {
                $existing->setCode($code);
            } else {
                $entry = new WorkEntry();
                $entry->setUser($user);
                $entry->setWorkDate($date);
                $entry->setCode($code);
                $entityManager->persist($entry);
            }

            $entityManager->flush();

            return new JsonResponse([
                'message' => 'Saved successfully'
            ]);
        } catch (\Throwable $e) {
            return new JsonResponse([
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}