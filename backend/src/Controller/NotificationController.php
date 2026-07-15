<?php

namespace App\Controller;

use App\Entity\User;
use App\Repository\NotificationRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;

/**
 * Expose uniquement les notifications appartenant a l'utilisateur authentifie.
 */
class NotificationController
{
    #[Route('/api/notifications', methods: ['GET'])]
    public function list(
        #[CurrentUser] User $user,
        NotificationRepository $notificationRepository
    ): JsonResponse {
        // CurrentUser vient du JWT : aucun userId transmis par React n'est necessaire.
        $notifications = $notificationRepository->findBy(
            ['user' => $user],
            ['id' => 'DESC']
        );

        return new JsonResponse(array_map(static function ($notification) {
            return [
                'id' => $notification->getId(),
                'title' => $notification->getTitle(),
                'message' => $notification->getMessage(),
                'type' => $notification->getType(),
                'isRead' => $notification->isRead(),
                'createdAt' => $notification->getCreatedAt()?->format('Y-m-d H:i'),
            ];
        }, $notifications));
    }

    #[Route('/api/notifications/{id}/read', methods: ['PATCH'])]
    public function markAsRead(
        int $id,
        #[CurrentUser] User $user,
        NotificationRepository $notificationRepository,
        EntityManagerInterface $entityManager
    ): JsonResponse {
        $notification = $notificationRepository->find($id);

        // Cette verification empeche un utilisateur de modifier la notification d'un autre.
        if (!$notification || $notification->getUser()?->getId() !== $user->getId()) {
            return new JsonResponse(['message' => 'Notification not found'], 404);
        }

        $notification->setIsRead(true);
        // L'entite existe deja : Doctrine detecte le changement et flush lance l'UPDATE.
        $entityManager->flush();

        return new JsonResponse(['message' => 'Notification marked as read']);
    }

    #[Route('/api/notifications/read-all', methods: ['PATCH'])]
    public function markAllAsRead(
        #[CurrentUser] User $user,
        NotificationRepository $notificationRepository,
        EntityManagerInterface $entityManager
    ): JsonResponse {
        // Le repository ne charge que les notifications non lues de CurrentUser.
        $notifications = $notificationRepository->findBy([
            'user' => $user,
            'isRead' => false,
        ]);

        foreach ($notifications as $notification) {
            $notification->setIsRead(true);
        }

        // Un seul flush synchronise toutes les modifications avec la base.
        $entityManager->flush();

        return new JsonResponse(['message' => 'All notifications marked as read']);
    }
}
