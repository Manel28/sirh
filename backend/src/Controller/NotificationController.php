<?php

namespace App\Controller;

use App\Repository\NotificationRepository;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;

class NotificationController
{
    #[Route('/api/notifications/{userId}', methods: ['GET'])]
    public function list(
        int $userId,
        UserRepository $userRepository,
        NotificationRepository $notificationRepository
    ): JsonResponse {
        $user = $userRepository->find($userId);

        if (!$user) {
            return new JsonResponse(['message' => 'User not found'], 404);
        }

        $notifications = $notificationRepository->findBy(
            ['user' => $user],
            ['id' => 'DESC']
        );

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

    #[Route('/api/notifications/{id}/read', methods: ['PATCH'])]
    public function markAsRead(
        int $id,
        NotificationRepository $notificationRepository,
        EntityManagerInterface $entityManager
    ): JsonResponse {
        $notification = $notificationRepository->find($id);

        if (!$notification) {
            return new JsonResponse(['message' => 'Notification not found'], 404);
        }

        $notification->setIsRead(true);
        $entityManager->flush();

        return new JsonResponse(['message' => 'Notification marked as read']);
    }

    #[Route('/api/notifications/user/{userId}/read-all', methods: ['PATCH'])]
    public function markAllAsRead(
        int $userId,
        UserRepository $userRepository,
        NotificationRepository $notificationRepository,
        EntityManagerInterface $entityManager
    ): JsonResponse {
        $user = $userRepository->find($userId);

        if (!$user) {
            return new JsonResponse(['message' => 'User not found'], 404);
        }

        $notifications = $notificationRepository->findBy([
            'user' => $user,
            'isRead' => false,
        ]);

        foreach ($notifications as $notification) {
            $notification->setIsRead(true);
        }

        $entityManager->flush();

        return new JsonResponse(['message' => 'All notifications marked as read']);
    }
}