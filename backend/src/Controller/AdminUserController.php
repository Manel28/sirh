<?php

namespace App\Controller;

use App\Entity\User;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Attribute\Route;

class AdminUserController
{
    #[Route('/api/admin/users', name: 'api_admin_users_list', methods: ['GET'])]
    public function listUsers(UserRepository $userRepository): JsonResponse
    {
        try {
            $users = $userRepository->findBy([], ['id' => 'DESC']);

            $data = array_map(function (User $user) {
                return [
                    'id' => $user->getId(),
                    'firstName' => $user->getFirstName(),
                    'lastName' => $user->getLastName(),
                    'email' => $user->getEmail(),
                    'jobTitle' => $user->getJobTitle(),
                    'department' => $user->getDepartment(),
                    'photo' => $user->getPhoto(),
                    'roles' => $user->getRoles(),
                ];
            }, $users);

            return new JsonResponse($data);
        } catch (\Throwable $e) {
            return new JsonResponse([
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ], 500);
        }
    }

    #[Route('/api/admin/users', name: 'api_admin_users_create', methods: ['POST'])]
    public function createUser(
        Request $request,
        UserRepository $userRepository,
        EntityManagerInterface $entityManager,
        UserPasswordHasherInterface $passwordHasher
    ): JsonResponse {
        try {
            $data = json_decode($request->getContent(), true);

            if (
                !$data ||
                empty($data['firstName']) ||
                empty($data['lastName']) ||
                empty($data['email']) ||
                empty($data['jobTitle']) ||
                empty($data['department'])
            ) {
                return new JsonResponse([
                    'message' => 'Missing required fields'
                ], 400);
            }

            $email = strtolower(trim($data['email']));

            $existingUser = $userRepository->findOneBy(['email' => $email]);

            if ($existingUser) {
                return new JsonResponse([
                    'message' => 'A user with this email already exists'
                ], 409);
            }

            $user = new User();
            $user->setFirstName($data['firstName']);
            $user->setLastName($data['lastName']);
            $user->setEmail($email);
            $user->setJobTitle($data['jobTitle']);
            $user->setDepartment($data['department']);
            $user->setPhoto($data['photo'] ?? null);
            $user->setRoles(!empty($data['isAdmin']) ? ['ROLE_ADMIN'] : ['ROLE_USER']);

            $temporaryPassword = '123456';
            $user->setPassword($passwordHasher->hashPassword($user, $temporaryPassword));

            $entityManager->persist($user);
            $entityManager->flush();

            return new JsonResponse([
                'message' => 'Collaborator created successfully',
                'temporaryPassword' => $temporaryPassword,
                'user' => [
                    'id' => $user->getId(),
                    'firstName' => $user->getFirstName(),
                    'lastName' => $user->getLastName(),
                    'email' => $user->getEmail(),
                    'jobTitle' => $user->getJobTitle(),
                    'department' => $user->getDepartment(),
                    'photo' => $user->getPhoto(),
                    'roles' => $user->getRoles(),
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
}