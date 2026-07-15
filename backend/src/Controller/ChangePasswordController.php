<?php

namespace App\Controller;

use App\Entity\User;
use App\Service\PasswordPolicy;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;

class ChangePasswordController
{
    public function __construct(private readonly PasswordPolicy $passwordPolicy)
    {
    }

    #[Route('/api/change-password', name: 'api_change_password', methods: ['POST'])]
    public function changePassword(
        #[CurrentUser] User $user,
        Request $request,
        UserPasswordHasherInterface $passwordHasher,
        EntityManagerInterface $entityManager
    ): JsonResponse {
        try {
            $data = json_decode($request->getContent(), true);
            $password = is_array($data) ? (string) ($data['newPassword'] ?? '') : '';

            if ($password === '') {
                return new JsonResponse(['message' => 'New password is required.'], 400);
            }

            if (!$this->passwordPolicy->isValid($password)) {
                return new JsonResponse([
                    'message' => 'Le mot de passe doit contenir au moins 8 caracteres, une majuscule, une minuscule, un chiffre et un caractere special.',
                ], 400);
            }

            $user->setPassword($passwordHasher->hashPassword($user, $password));
            $user->setMustChangePassword(false);
            $entityManager->flush();

            return new JsonResponse([
                'message' => 'Password changed successfully',
                'user' => [
                    'id' => $user->getId(),
                    'email' => $user->getEmail(),
                    'roles' => $user->getRoles(),
                    'firstName' => $user->getFirstName(),
                    'lastName' => $user->getLastName(),
                    'jobTitle' => $user->getJobTitle(),
                    'department' => $user->getDepartment(),
                    'photo' => $user->getPhoto(),
                    'mustChangePassword' => $user->isMustChangePassword(),
                ],
            ]);
        } catch (\Throwable) {
            return new JsonResponse(['message' => 'Server error while changing password.'], 500);
        }
    }
}
