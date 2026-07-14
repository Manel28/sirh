<?php

namespace App\Controller;

use App\Entity\User;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Email;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

/**
 * Contrôleur dédié à la gestion des utilisateurs par l'administrateur RH.
 *
 * Il permet :
 * - de lister les collaborateurs 
 * - de créer un nouveau collaborateur 
 * - de modifier un collaborateur 
 * - de supprimer un collaborateur 
 * - de générer un mot de passe temporaire sécurisé
 */
#[IsGranted('ROLE_ADMIN')]
class AdminUserController
{
    /**
     * Retourne la liste de tous les utilisateurs.
     */
    #[Route('/api/admin/users', name: 'api_admin_users_list', methods: ['GET'])]
    public function listUsers(UserRepository $userRepository): JsonResponse
    {
        // Récupération des utilisateurs du plus récent au plus ancien
        $users = $userRepository->findBy([], ['id' => 'DESC']);

        // Transformation des entités User en tableau JSON exploitable par React
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
                'mustChangePassword' => $user->isMustChangePassword(),
            ];
        }, $users);

        return new JsonResponse($data);
    }

    /**
     * Crée un nouveau collaborateur.
     *
     * Le mot de passe temporaire est généré automatiquement,
     * chiffré, puis envoyé par email à l'utilisateur.
     */
    #[Route('/api/admin/users', name: 'api_admin_users_create', methods: ['POST'])]
    public function createUser(
        Request $request,
        UserRepository $userRepository,
        EntityManagerInterface $entityManager,
        UserPasswordHasherInterface $passwordHasher,
        MailerInterface $mailer
    ): JsonResponse {
        try {
            // Décodage du JSON reçu depuis le frontend
            $data = json_decode($request->getContent(), true);
            // Vérification des champs obligatoires
            if (
                !$data ||
                empty($data['firstName']) ||
                empty($data['lastName']) ||
                empty($data['email']) ||
                empty($data['jobTitle']) ||
                empty($data['department'])
            ) {
                return new JsonResponse(['message' => 'Missing required fields'], 400);
            }
            // Nettoyage et normalisation de l'adresse email
            $email = strtolower(trim($data['email']));
            // Vérification de l'unicité de l'email
            if ($userRepository->findOneBy(['email' => $email])) {
                return new JsonResponse(['message' => 'A user with this email already exists'], 409);
            }
            // Génération d'un mot de passe temporaire sécurisé
            $temporaryPassword = $this->generateStrongPassword();
            // Création de l'entité utilisateur
            $user = new User();
            $user->setFirstName(trim($data['firstName']));
            $user->setLastName(trim($data['lastName']));
            $user->setEmail($email);
            $user->setJobTitle(trim($data['jobTitle']));
            $user->setDepartment(trim($data['department']));
            $user->setPhoto($data['photo'] ?? null);

            // Attribution du rôle selon la case Admin/RH cochée ou non
            $user->setRoles(!empty($data['isAdmin']) ? ['ROLE_ADMIN'] : ['ROLE_USER']);

            // Chiffrement du mot de passe temporaire
            $user->setPassword($passwordHasher->hashPassword($user, $temporaryPassword));

            // Oblige l'utilisateur à changer son mot de passe à la première connexion
            $user->setMustChangePassword(true);

            // Enregistrement en base de données
            $entityManager->persist($user);
            $entityManager->flush();

            // Préparation de l'email contenant les identifiants temporaires
            $emailMessage = (new Email())
                ->from('adminsirh@gmail.com')
                ->to($user->getEmail())
                ->subject('Your collaborator account has been created')
                ->html("
                    <h2>Hello {$user->getFirstName()},</h2>
                    <p>Your collaborator account has been created successfully.</p>
                    <p><strong>Email:</strong> {$user->getEmail()}</p>
                    <p><strong>Temporary password:</strong> {$temporaryPassword}</p>
                    <p>You must change your password after your first login.</p>
                    <br>
                    <p>HR Team</p>
                ");

            // Envoi de l'email
            $mailer->send($emailMessage);

            return new JsonResponse([
                'message' => 'Collaborator created successfully. An email has been sent.',
            ], 201);

        } catch (\Throwable $e) {
            // Gestion des erreurs serveur
            return new JsonResponse([
                'message' => 'Server error',
            ], 500);
        }
    }

    /**
     * Met à jour les informations d'un collaborateur.
     */
    #[Route('/api/admin/users/{id}', name: 'api_admin_users_update', methods: ['PUT'])]
    public function updateUser(
        int $id,
        Request $request,
        UserRepository $userRepository,
        EntityManagerInterface $entityManager
    ): JsonResponse {
        try {
            // Recherche de l'utilisateur à modifier
            $user = $userRepository->find($id);

            if (!$user) {
                return new JsonResponse(['message' => 'Collaborator not found'], 404);
            }

            // Décodage des données reçues
            $data = json_decode($request->getContent(), true);

            if (!$data) {
                return new JsonResponse(['message' => 'Invalid data'], 400);
            }

            // Vérification des champs obligatoires
            if (
                empty($data['firstName']) ||
                empty($data['lastName']) ||
                empty($data['email']) ||
                empty($data['jobTitle']) ||
                empty($data['department'])
            ) {
                return new JsonResponse(['message' => 'Missing required fields'], 400);
            }

            // Nettoyage de l'adresse email
            $email = strtolower(trim($data['email']));

            // Vérification que l'email n'est pas utilisé par un autre utilisateur
            $existingUser = $userRepository->findOneBy(['email' => $email]);

            if ($existingUser && $existingUser->getId() !== $user->getId()) {
                return new JsonResponse(['message' => 'A user with this email already exists'], 409);
            }

            // Mise à jour des informations du collaborateur
            $user->setFirstName(trim($data['firstName']));
            $user->setLastName(trim($data['lastName']));
            $user->setEmail($email);
            $user->setJobTitle(trim($data['jobTitle']));
            $user->setDepartment(trim($data['department']));
            $user->setPhoto($data['photo'] ?? null);
            $user->setRoles(!empty($data['isAdmin']) ? ['ROLE_ADMIN'] : ['ROLE_USER']);

            // Sauvegarde des modifications
            $entityManager->flush();

            return new JsonResponse([
                'message' => 'Collaborator updated successfully.',
            ]);

        } catch (\Throwable $e) {
            return new JsonResponse([
                'message' => 'Server error while updating collaborator',
            ], 500);
        }
    }

    /**
     * Supprime un collaborateur.
     *
     * Les comptes administrateurs/RH sont protégés
     * et ne peuvent pas être supprimés par cette méthode.
     */
    #[Route('/api/admin/users/{id}', name: 'api_admin_users_delete', methods: ['DELETE'])]
    public function deleteUser(
        int $id,
        UserRepository $userRepository,
        EntityManagerInterface $entityManager
    ): JsonResponse {
        // Recherche du collaborateur à supprimer
        $user = $userRepository->find($id);

        if (!$user) {
            return new JsonResponse(['message' => 'Collaborator not found'], 404);
        }

        // Empêche la suppression d'un administrateur/RH
        if (in_array('ROLE_ADMIN', $user->getRoles(), true)) {
            return new JsonResponse(['message' => 'Cannot delete admin / HR account'], 403);
        }

        // Suppression des documents liés au collaborateur
        foreach ($user->getDocuments() as $document) {
            $entityManager->remove($document);
        }

        // Suppression des demandes de congé liées au collaborateur
        foreach ($user->getLeaves() as $leave) {
            $entityManager->remove($leave);
        }

        // Suppression des entrées de calendrier liées au collaborateur
        foreach ($user->getWorkEntries() as $workEntry) {
            $entityManager->remove($workEntry);
        }

        // Suppression du collaborateur
        $entityManager->remove($user);
        $entityManager->flush();

        return new JsonResponse([
            'message' => 'Collaborator deleted successfully',
        ]);
    }

    /**
     * Génère un mot de passe fort.
     *
     * Le mot de passe contient au minimum :
     * - une lettre minuscule ;
     * - une lettre majuscule ;
     * - un chiffre ;
     * - un caractère spécial.
     */
    private function generateStrongPassword(int $length = 12): string
    {
        // Jeux de caractères utilisés pour construire le mot de passe
        $lowercase = 'abcdefghijklmnopqrstuvwxyz';
        $uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        $numbers = '0123456789';
        $symbols = '!@#$%&*?';

        // Garantit la présence d'au moins un caractère de chaque type
        $password = [
            $lowercase[random_int(0, strlen($lowercase) - 1)],
            $uppercase[random_int(0, strlen($uppercase) - 1)],
            $numbers[random_int(0, strlen($numbers) - 1)],
            $symbols[random_int(0, strlen($symbols) - 1)],
        ];

        // Ensemble complet des caractères possibles
        $all = $lowercase . $uppercase . $numbers . $symbols;

        // Complète le mot de passe jusqu'à la longueur demandée
        for ($i = count($password); $i < $length; $i++) {
            $password[] = $all[random_int(0, strlen($all) - 1)];
        }

        // Mélange les caractères pour éviter un ordre prévisible
        shuffle($password);

        return implode('', $password);
    }
}
