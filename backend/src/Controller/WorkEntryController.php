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

/**
 * Contrôleur dédié à la gestion du calendrier de travail.
 *
 * Il permet :
 * - de récupérer les entrées de planning d'un mois 
 * - d'afficher automatiquement les congés validés dans le calendrier 
 * - d'enregistrer un code de présence ou d'absence 
 * - d'empêcher la modification d'un jour couvert par un congé approuvé
 */
class WorkEntryController
{
    /**
     * Récupère les entrées de calendrier pour un mois donné.
     *
     * Si un userId est fourni :
     * - seules les entrées de cet utilisateur sont retournées.
     *
     * Sinon :
     * - toutes les entrées du mois sont retournées.
     */
    #[Route('/api/work-entries', methods: ['GET'])]
    public function getWorkEntries(
        Request $request,
        WorkEntryRepository $workEntryRepository,
        LeaveRepository $leaveRepository,
        UserRepository $userRepository
    ): JsonResponse {
        try {
            // Récupération des paramètres envoyés par le frontend
            $month = $request->query->get('month');
            $userId = $request->query->get('userId');

            // Le mois est obligatoire pour construire la période à rechercher
            if (!$month) {
                return new JsonResponse(['message' => 'Missing month'], 400);
            }

            // Construction du premier et dernier jour du mois sélectionné
            $start = new \DateTime($month . '-01');
            $end = (clone $start)->modify('last day of this month');

            // Création de la requête pour récupérer les entrées du mois
            $qb = $workEntryRepository->createQueryBuilder('w')
                ->where('w.workDate BETWEEN :start AND :end')
                ->setParameter('start', $start)
                ->setParameter('end', $end);

            // Si un utilisateur est précisé, on filtre les entrées sur cet utilisateur
            if ($userId) {
                $user = $userRepository->find($userId);

                if (!$user) {
                    return new JsonResponse(['message' => 'User not found'], 404);
                }

                $qb->andWhere('w.user = :user')
                    ->setParameter('user', $user);
            }

            // Exécution de la requête
            $entries = $qb->getQuery()->getResult();

            // Tableau qui sera retourné au frontend
            $data = [];

            // Transformation des entités WorkEntry en tableau JSON
            foreach ($entries as $entry) {
                $data[] = [
                    'id' => $entry->getId(),
                    'date' => $entry->getWorkDate()?->format('Y-m-d'),
                    'code' => $entry->getCode(),
                    'userId' => $entry->getUser()?->getId(),
                ];
            }

            /**
             * Récupération des congés approuvés sur le mois.
             *
             * Les congés validés sont automatiquement affichés
             * dans le calendrier avec le code LV.
             */
            $leaveQb = $leaveRepository->createQueryBuilder('l')
                ->where('l.status = :status')
                ->andWhere('l.startDate <= :end')
                ->andWhere('l.endDate >= :start')
                ->setParameter('status', 'Approved')
                ->setParameter('start', $start)
                ->setParameter('end', $end);

            // Si un utilisateur est précisé, on filtre aussi les congés sur cet utilisateur
            if ($userId) {
                $leaveQb->andWhere('l.user = :user')
                    ->setParameter('user', $user);
            }

            // Exécution de la requête des congés approuvés
            $approvedLeaves = $leaveQb->getQuery()->getResult();

            /**
             * Ajout des congés approuvés dans les données du calendrier.
             *
             * Si une entrée existe déjà sur une date couverte par un congé,
             * elle est remplacée par le code LV.
             */
            foreach ($approvedLeaves as $leave) {
                $leaveStart = $leave->getStartDate();
                $leaveEnd = $leave->getEndDate();
                $user = $leave->getUser();

                // Vérifie que la demande possède bien des dates et un utilisateur
                if (!$leaveStart || !$leaveEnd || !$user) {
                    continue;
                }

                // Parcours de chaque jour de la période de congé
                $current = clone $leaveStart;

                while ($current <= $leaveEnd) {
                    $dateString = $current->format('Y-m-d');
                    $key = $user->getId() . '_' . $dateString;

                    // Suppression d'une éventuelle entrée existante pour ce jour
                    $data = array_values(array_filter($data, function ($row) use ($key) {
                        return ($row['userId'] . '_' . $row['date']) !== $key;
                    }));

                    // Ajout d'une entrée virtuelle de congé validé
                    $data[] = [
                        'id' => null,
                        'date' => $dateString,
                        'code' => 'LV',
                        'userId' => $user->getId(),
                    ];

                    $current->modify('+1 day');
                }
            }

            // Tri des données par utilisateur puis par date
            usort($data, function ($a, $b) {
                return [$a['userId'], $a['date']] <=> [$b['userId'], $b['date']];
            });

            return new JsonResponse($data);
        } catch (\Throwable $e) {
            // Gestion des erreurs serveur
            return new JsonResponse(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Enregistre ou modifie une entrée de calendrier.
     *
     * Codes autorisés :
     * - SS : sur site ;
     * - TT : télétravail ;
     * - TR : formation ;
     * - AB : absence ;
     * - chaîne vide : suppression de l'entrée.
     */
    #[Route('/api/work-entries', methods: ['POST'])]
    public function saveWorkEntry(
        Request $request,
        EntityManagerInterface $entityManager,
        WorkEntryRepository $workEntryRepository,
        UserRepository $userRepository,
        LeaveRepository $leaveRepository
    ): JsonResponse {
        try {
            // Décodage des données JSON reçues
            $data = json_decode($request->getContent(), true);

            // Vérification de la structure des données
            if (
                !$data ||
                !isset($data['userId']) ||
                !isset($data['date']) ||
                !array_key_exists('code', $data)
            ) {
                return new JsonResponse(['message' => 'Invalid data'], 400);
            }

            // Recherche de l'utilisateur concerné
            $user = $userRepository->find($data['userId']);

            if (!$user) {
                return new JsonResponse(['message' => 'User not found'], 404);
            }

            // Conversion de la date reçue
            $date = new \DateTime($data['date']);

            // Nettoyage et normalisation du code envoyé
            $code = strtoupper(trim((string) $data['code']));

            // Liste des codes autorisés
            $allowedCodes = ['', 'SS', 'TT', 'TR', 'AB'];

            if (!in_array($code, $allowedCodes, true)) {
                return new JsonResponse(['message' => 'Invalid code'], 400);
            }

            /**
             * Vérifie si la date est couverte par un congé approuvé.
             *
             * Dans ce cas, la journée est verrouillée et ne peut pas
             * être modifiée depuis le calendrier.
             */
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
                    'message' => 'This day is covered by an approved leave.'
                ], 400);
            }

            // Recherche d'une entrée déjà existante pour cet utilisateur et cette date
            $existing = $workEntryRepository->findOneBy([
                'user' => $user,
                'workDate' => $date,
            ]);

            /**
             * Si le code est vide, cela signifie que l'utilisateur
             * veut supprimer l'entrée existante.
             */
            if ($code === '') {
                if ($existing) {
                    $entityManager->remove($existing);
                    $entityManager->flush();
                }

                return new JsonResponse(['message' => 'Entry cleared successfully']);
            }

            /**
             * Si une entrée existe déjà, on la met à jour.
             * Sinon, on crée une nouvelle entrée.
             */
            if ($existing) {
                $existing->setCode($code);
            } else {
                $entry = new WorkEntry();
                $entry->setUser($user);
                $entry->setWorkDate($date);
                $entry->setCode($code);

                $entityManager->persist($entry);
            }

            // Sauvegarde en base de données
            $entityManager->flush();

            return new JsonResponse(['message' => 'Saved successfully']);
        } catch (\Throwable $e) {
            // Gestion des erreurs serveur
            return new JsonResponse(['error' => $e->getMessage()], 500);
        }
    }
}