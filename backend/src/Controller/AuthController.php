<?php

namespace App\Controller;

use App\Repository\UserRepository;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Attribute\Route;

/**
 * Contrôleur d'authentification.
 *
 * Il permet :
 * - de gérer la connexion d'un utilisateur 
 * - de vérifier l'email et le mot de passe 
 * - de retourner les informations de l'utilisateur connecté 
 * - de gérer les headers CORS pour autoriser les appels depuis le frontend
 */
class AuthController
{
    /**
     * Route OPTIONS utilisée pour répondre aux requêtes CORS préliminaires.
     */
    #[Route('/api/login', name: 'api_login_options', methods: ['OPTIONS'])]
    public function loginOptions(): JsonResponse
    {
        return $this->corsResponse(new JsonResponse(null, 204));
    }

    /**
     * Authentifie un utilisateur.
     *
     * Étapes :
     * - récupère les données envoyées par le frontend ;
     * - vérifie la présence de l'email et du mot de passe ;
     * - recherche l'utilisateur en base ;
     * - vérifie le mot de passe ;
     * - retourne les informations nécessaires au frontend.
     */
    #[Route('/api/login', name: 'api_login', methods: ['POST'])]
    public function login(
        Request $request,
        UserRepository $userRepository,
        UserPasswordHasherInterface $passwordHasher
    ): JsonResponse {
        try {
            // Décodage du JSON reçu depuis la requête HTTP
            $data = json_decode($request->getContent(), true);

            // Vérification des champs obligatoires
            if (!$data || empty($data['email']) || empty($data['password'])) {
                return $this->corsResponse(
                    new JsonResponse(['message' => 'Missing email or password'], 400)
                );
            }

            // Normalisation de l'email
            $email = strtolower(trim($data['email']));

            // Recherche de l'utilisateur par email
            $user = $userRepository->findOneBy(['email' => $email]);

            // Si aucun utilisateur n'est trouvé
            if (!$user) {
                return $this->corsResponse(
                    new JsonResponse(['message' => 'User not found'], 404)
                );
            }

            // Vérification du mot de passe chiffré
            if (!$passwordHasher->isPasswordValid($user, $data['password'])) {
                return $this->corsResponse(
                    new JsonResponse(['message' => 'Invalid password'], 401)
                );
            }

            // Retour des données utilisateur au frontend
            return $this->corsResponse(
                new JsonResponse([
                    'message' => 'Login successful',

                    // Indique si l'utilisateur doit changer son mot de passe
                    'mustChangePassword' => $user->isMustChangePassword(),

                    // Informations stockées côté frontend après connexion
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
            // Gestion des erreurs serveur
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

    /**
     * Ajoute les headers CORS à une réponse JSON.
     *
     * Ces headers permettent au frontend React
     * de communiquer avec le backend Symfony.
     */
    private function corsResponse(JsonResponse $response): JsonResponse
    {
        // Autorise les requêtes depuis n'importe quelle origine
        $response->headers->set('Access-Control-Allow-Origin', '*');

        // Autorise les méthodes HTTP utilisées par l'API
        $response->headers->set(
            'Access-Control-Allow-Methods',
            'GET, POST, PUT, PATCH, DELETE, OPTIONS'
        );

        // Autorise les headers envoyés par le frontend
        $response->headers->set(
            'Access-Control-Allow-Headers',
            'Content-Type, Authorization, X-Requested-With'
        );

        // Durée de mise en cache de la réponse CORS
        $response->headers->set('Access-Control-Max-Age', '3600');

        return $response;
    }
}