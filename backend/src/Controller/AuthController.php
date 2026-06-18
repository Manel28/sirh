<?php

namespace App\Controller;

use App\Repository\UserRepository;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Attribute\Route;

class AuthController
{
    #[Route('/api/login', name: 'api_login_options', methods: ['OPTIONS'])]
    public function loginOptions(): JsonResponse
    {
        return $this->corsResponse(new JsonResponse(null, 204));
    }

    #[Route('/api/login', name: 'api_login', methods: ['POST'])]
    public function login(
        Request $request,
        UserRepository $userRepository,
        UserPasswordHasherInterface $passwordHasher
    ): JsonResponse {
        try {
            $data = json_decode($request->getContent(), true);

            if (!$data || empty($data['email']) || empty($data['password'])) {
                return $this->corsResponse(
                    new JsonResponse(['message' => 'Missing email or password'], 400)
                );
            }

            $email = strtolower(trim($data['email']));
            $user = $userRepository->findOneBy(['email' => $email]);

            if (!$user) {
                return $this->corsResponse(
                    new JsonResponse(['message' => 'User not found'], 404)
                );
            }

            if (!$passwordHasher->isPasswordValid($user, $data['password'])) {
                return $this->corsResponse(
                    new JsonResponse(['message' => 'Invalid password'], 401)
                );
            }

            return $this->corsResponse(
                new JsonResponse([
                    'message' => 'Login successful',
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
                ], 200)
            );
        } catch (\Throwable $e) {
            return $this->corsResponse(
                new JsonResponse([
                    'message' => 'Server error while logging in.',
                    'error' => $e->getMessage(),
                    'file' => $e->getFile(),
                    'line' => $e->getLine(),
                ], 500)
            );
        }
    }

    private function corsResponse(JsonResponse $response): JsonResponse
    {
        $response->headers->set('Access-Control-Allow-Origin', '*');
        $response->headers->set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
        $response->headers->set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
        $response->headers->set('Access-Control-Max-Age', '3600');

        return $response;
    }
}