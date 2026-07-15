<?php

namespace App\Controller;

use App\Entity\User;
use App\Entity\WorkEntry;
use App\Repository\LeaveRepository;
use App\Repository\UserRepository;
use App\Repository\WorkEntryRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;

/**
 * Gere le calendrier mensuel : presence, teletravail, formation, absence et conges.
 */
class WorkEntryController
{
    #[Route('/api/work-entries', methods: ['GET'])]
    public function getWorkEntries(
        #[CurrentUser] User $currentUser,
        Request $request,
        WorkEntryRepository $workEntryRepository,
        LeaveRepository $leaveRepository,
        UserRepository $userRepository
    ): JsonResponse {
        try {
            // Le frontend demande un mois au format YYYY-MM.
            $month = (string) $request->query->get('month', '');

            if (!preg_match('/^\d{4}-(0[1-9]|1[0-2])$/', $month)) {
                return new JsonResponse(['message' => 'Invalid month.'], 400);
            }

            $start = \DateTime::createFromFormat('!Y-m-d', $month . '-01');

            if (!$start) {
                return new JsonResponse(['message' => 'Invalid month.'], 400);
            }

            $end = (clone $start)->modify('last day of this month');
            $isAdmin = in_array('ROLE_ADMIN', $currentUser->getRoles(), true);
            $targetUser = $isAdmin ? null : $currentUser;
            $requestedUserId = $request->query->get('userId');

            if ($isAdmin && $requestedUserId) {
                // Seul le RH peut filtrer le calendrier sur un autre collaborateur.
                $targetUser = $userRepository->find($requestedUserId);

                if (!$targetUser) {
                    return new JsonResponse(['message' => 'User not found'], 404);
                }
            }

            // QueryBuilder cree une requete Doctrine parametree sur la periode demandee.
            $entryQuery = $workEntryRepository->createQueryBuilder('w')
                ->where('w.workDate BETWEEN :start AND :end')
                ->setParameter('start', $start)
                ->setParameter('end', $end);

            if ($targetUser) {
                $entryQuery->andWhere('w.user = :user')->setParameter('user', $targetUser);
            }

            $data = [];

            foreach ($entryQuery->getQuery()->getResult() as $entry) {
                $data[] = [
                    'id' => $entry->getId(),
                    'date' => $entry->getWorkDate()?->format('Y-m-d'),
                    'code' => $entry->getCode(),
                    'userId' => $entry->getUser()?->getId(),
                ];
            }

            $leaveQuery = $leaveRepository->createQueryBuilder('l')
                ->where('l.status = :status')
                ->andWhere('l.startDate <= :end')
                ->andWhere('l.endDate >= :start')
                ->setParameter('status', 'Approved')
                ->setParameter('start', $start)
                ->setParameter('end', $end);

            if ($targetUser) {
                $leaveQuery->andWhere('l.user = :user')->setParameter('user', $targetUser);
            }

            foreach ($leaveQuery->getQuery()->getResult() as $leave) {
                $leaveStart = $leave->getStartDate();
                $leaveEnd = $leave->getEndDate();
                $leaveUser = $leave->getUser();

                if (!$leaveStart || !$leaveEnd || !$leaveUser) {
                    continue;
                }

                $current = \DateTime::createFromInterface($leaveStart);

                while ($current <= $leaveEnd) {
                    $dateString = $current->format('Y-m-d');
                    $key = $leaveUser->getId() . '_' . $dateString;

                    $data = array_values(array_filter(
                        $data,
                        static fn (array $row) => ($row['userId'] . '_' . $row['date']) !== $key
                    ));

                    // Un conge approuve remplace toute saisie manuelle par le code LV.
                    $data[] = [
                        'id' => null,
                        'date' => $dateString,
                        'code' => 'LV',
                        'userId' => $leaveUser->getId(),
                    ];

                    $current->modify('+1 day');
                }
            }

            usort(
                $data,
                static fn (array $a, array $b) => [$a['userId'], $a['date']] <=> [$b['userId'], $b['date']]
            );

            // React recoit une liste deja fusionnee et triee par utilisateur puis par date.
            return new JsonResponse($data);
        } catch (\Throwable) {
            return new JsonResponse(['message' => 'Server error while loading work entries.'], 500);
        }
    }

    #[Route('/api/work-entries', methods: ['POST'])]
    public function saveWorkEntry(
        #[CurrentUser] User $user,
        Request $request,
        EntityManagerInterface $entityManager,
        WorkEntryRepository $workEntryRepository,
        LeaveRepository $leaveRepository
    ): JsonResponse {
        try {
            // Le body JSON contient une date et le code choisi dans le select du calendrier.
            $data = json_decode($request->getContent(), true);

            if (!is_array($data) || !isset($data['date']) || !array_key_exists('code', $data)) {
                return new JsonResponse(['message' => 'Invalid data'], 400);
            }

            $dateString = (string) $data['date'];
            $date = \DateTime::createFromFormat('!Y-m-d', $dateString);

            if (!$date || $date->format('Y-m-d') !== $dateString) {
                return new JsonResponse(['message' => 'Invalid date'], 400);
            }

            $code = strtoupper(trim((string) $data['code']));

            if (!in_array($code, ['', 'SS', 'TT', 'TR', 'AB'], true)) {
                return new JsonResponse(['message' => 'Invalid code'], 400);
            }

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
                // Une journee couverte par un conge approuve est verrouillee.
                return new JsonResponse([
                    'message' => 'This day is covered by an approved leave.',
                ], 409);
            }

            $existing = $workEntryRepository->findOneBy([
                'user' => $user,
                'workDate' => $date,
            ]);

            if ($code === '') {
                // Un code vide signifie que l'utilisateur efface son ancienne saisie.
                if ($existing) {
                    $entityManager->remove($existing);
                    $entityManager->flush();
                }

                return new JsonResponse(['message' => 'Entry cleared successfully']);
            }

            if ($existing) {
                // Mise a jour de l'entite deja suivie par Doctrine.
                $existing->setCode($code);
            } else {
                // Nouvelle date : persist ajoute l'entite a l'unite de travail Doctrine.
                $entry = (new WorkEntry())
                    ->setUser($user)
                    ->setWorkDate($date)
                    ->setCode($code);
                $entityManager->persist($entry);
            }

            // flush realise l'INSERT, l'UPDATE ou le DELETE prepare ci-dessus.
            $entityManager->flush();

            return new JsonResponse(['message' => 'Saved successfully']);
        } catch (\Throwable) {
            return new JsonResponse(['message' => 'Server error while saving work entry.'], 500);
        }
    }
}
