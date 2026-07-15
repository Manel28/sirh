<?php

namespace App\Controller;

use App\Repository\UserRepository;
use Lexik\Bundle\JWTAuthenticationBundle\Services\JWTTokenManagerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Attribute\Route;

/**
 * Point d'entree de la connexion : verifie les identifiants puis cree le JWT.
 */
class AuthController
{
    // Repond au precontrole CORS envoye par le navigateur avant le POST reel.
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
            // Le body JSON envoye par authService est transforme en tableau PHP.
            $data = json_decode($request->getContent(), true);

            if (!is_array($data)) {
                return new JsonResponse(['message' => 'Invalid JSON body.'], 400);
            }

            $email = strtolower(trim((string) ($data['email'] ?? '')));
            $password = (string) ($data['password'] ?? '');

            if ($email === '' || $password === '') {
                return new JsonResponse(['message' => 'Email and password are required.'], 400);
            }

            // Le repository interroge la table user avec Doctrine a partir de l'email.
            $user = $userRepository->findOneBy(['email' => $email]);

            // Use the same response for an unknown email and a wrong password.
            if (!$user || !$passwordHasher->isPasswordValid($user, $password)) {
                return new JsonResponse(['message' => 'Invalid email or password.'], 401);
            }

            // Le mot de passe est valide : LexikJWT signe un token puis Symfony
            // renvoie a React le token et les donnees utiles a l'interface.
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
