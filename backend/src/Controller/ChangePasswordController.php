<?php

namespace App\Controller;

use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Attribute\Route;

/**
 * Contrôleur dédié au changement de mot de passe.
 *
 * Il permet :
 * - de recevoir un nouveau mot de passe depuis le frontend 
 * - de vérifier sa complexité 
 * - de le chiffrer 
 * - de désactiver l'obligation de changement de mot de passe 
 * - de retourner les informations utilisateur mises à jour
 */
class ChangePasswordController
{
    /**
     * Change le mot de passe d'un utilisateur.
     */
    #[Route('/api/change-password', name: 'api_change_password', methods: ['POST'])]
    public function changePassword(
        Request $request,
        UserRepository $userRepository,
        UserPasswordHasherInterface $passwordHasher,
        EntityManagerInterface $entityManager
    ): JsonResponse {
        try {
            // Décodage des données JSON envoyées par le frontend
            $data = json_decode($request->getContent(), true);

            // Vérification des champs obligatoires
            if (!$data || empty($data['userId']) || empty($data['newPassword'])) {
                return new JsonResponse(['message' => 'Missing required fields'], 400);
            }

            // Récupération du nouveau mot de passe
            $password = $data['newPassword'];

            /**
             * Vérification de la complexité du mot de passe.
             *
             * Le mot de passe doit contenir :
             * - au moins 8 caractères ;
             * - une lettre majuscule ;
             * - une lettre minuscule ;
             * - un chiffre ;
             * - un caractère spécial.
             */
            if (
                strlen($password) < 8 ||
                !preg_match('/[A-Z]/', $password) ||
                !preg_match('/[a-z]/', $password) ||
                !preg_match('/[0-9]/', $password) ||
                !preg_match('/[\W_]/', $password)
            ) {
                return new JsonResponse([
                    'message' => 'Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial.'
                ], 400);
            }

            // Recherche de l'utilisateur concerné
            $user = $userRepository->find($data['userId']);

            if (!$user) {
                return new JsonResponse(['message' => 'User not found'], 404);
            }

            // Chiffrement du nouveau mot de passe
            $user->setPassword(
                $passwordHasher->hashPassword($user, $password)
            );

            // L'utilisateur n'a plus besoin de changer son mot de passe
            $user->setMustChangePassword(false);

            // Sauvegarde en base de données
            $entityManager->flush();

            // Retour des informations utilisateur mises à jour
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
                ]
            ]);
        } catch (\Throwable $e) {
            // Gestion des erreurs serveur
            return new JsonResponse([
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}