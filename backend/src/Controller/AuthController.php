<?php

namespace App\Controller;

use App\Repository\UserRepository;
use Lexik\Bundle\JWTAuthenticationBundle\Services\JWTTokenManagerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Attribute\Route;

class AuthController
{
    #[Route('/api/login', name: 'api_login_options', methods: ['OPTIONS'])]
    public function loginOptions(): JsonResponse
    {
        return new JsonResponse(null, 204);
    }

    #[Route('/api/login', name: 'api_login', methods: ['POST'])]
    public function login(
        Request $request,
        UserRepository $userRepository,
        UserPasswordHasherInterface $passwordHasher,
        JWTTokenManagerInterface $jwtManager
    ): JsonResponse {
        try {
            $data = json_decode($request->getContent(), true);

            if (!is_array($data)) {
                return new JsonResponse(['message' => 'Invalid JSON body.'], 400);
            }

            $email = strtolower(trim((string) ($data['email'] ?? '')));
            $password = (string) ($data['password'] ?? '');

            if ($email === '' || $password === '') {
                return new JsonResponse(['message' => 'Email and password are required.'], 400);
            }

            $user = $userRepository->findOneBy(['email' => $email]);

            // Use the same response for an unknown email and a wrong password.
            if (!$user || !$passwordHasher->isPasswordValid($user, $password)) {
                return new JsonResponse(['message' => 'Invalid email or password.'], 401);
            }

            return new JsonResponse([
                'message' => 'Login successful',
                'token' => $jwtManager->create($user),
                'mustChangePassword' => $user->isMustChangePassword(),
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
            return new JsonResponse([
                'message' => 'Server error while logging in.',
            ], 500);
        }
    }
}
