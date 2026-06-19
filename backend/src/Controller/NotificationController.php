<?php

namespace App\Controller;

use App\Repository\NotificationRepository;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;

/**
 * Contrôleur dédié à la gestion des notifications.
 *
 * Il permet :
 * - de récupérer les notifications d'un utilisateur 
 * - de marquer une notification comme lue 
 * - de marquer toutes les notifications comme lues
 */
class NotificationController
{
    /**
     * Retourne toutes les notifications d'un utilisateur.
     */
    #[Route('/api/notifications/{userId}', methods: ['GET'])]
    public function list(
        int $userId,
        UserRepository $userRepository,
        NotificationRepository $notificationRepository
    ): JsonResponse {
        // Recherche de l'utilisateur concerné
        $user = $userRepository->find($userId);

        if (!$user) {
            return new JsonResponse(['message' => 'User not found'], 404);
        }

        // Récupération des notifications de la plus récente à la plus ancienne
        $notifications = $notificationRepository->findBy(
            ['user' => $user],
            ['id' => 'DESC']
        );

        // Transformation des entités Notification en tableau JSON
        $data = array_map(function ($notification) {
            return [
                'id' => $notification->getId(),
                'title' => $notification->getTitle(),
                'message' => $notification->getMessage(),
                'type' => $notification->getType(),
                'isRead' => $notification->isRead(),
                'createdAt' => $notification->getCreatedAt()?->format('Y-m-d H:i'),
            ];
        }, $notifications);

        return new JsonResponse($data);
    }

    /**
     * Marque une notification comme lue.
     */
    #[Route('/api/notifications/{id}/read', methods: ['PATCH'])]
    public function markAsRead(
        int $id,
        NotificationRepository $notificationRepository,
        EntityManagerInterface $entityManager
    ): JsonResponse {
        // Recherche de la notification
        $notification = $notificationRepository->find($id);

        if (!$notification) {
            return new JsonResponse(['message' => 'Notification not found'], 404);
        }

        // Mise à jour du statut de lecture
        $notification->setIsRead(true);

        // Sauvegarde en base de données
        $entityManager->flush();

        return new JsonResponse(['message' => 'Notification marked as read']);
    }

    /**
     * Marque toutes les notifications non lues d'un utilisateur comme lues.
     */
    #[Route('/api/notifications/user/{userId}/read-all', methods: ['PATCH'])]
    public function markAllAsRead(
        int $userId,
        UserRepository $userRepository,
        NotificationRepository $notificationRepository,
        EntityManagerInterface $entityManager
    ): JsonResponse {
        // Recherche de l'utilisateur concerné
        $user = $userRepository->find($userId);

        if (!$user) {
            return new JsonResponse(['message' => 'User not found'], 404);
        }

        // Récupération uniquement des notifications non lues
        $notifications = $notificationRepository->findBy([
            'user' => $user,
            'isRead' => false,
        ]);

        // Passage de chaque notification en statut lu
        foreach ($notifications as $notification) {
            $notification->setIsRead(true);
        }

        // Sauvegarde des modifications
        $entityManager->flush();

        return new JsonResponse(['message' => 'All notifications marked as read']);
    }
}