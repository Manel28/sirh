<?php

namespace App\Controller;

use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

/**
 * Contrôleur dédié à la gestion du profil utilisateur.
 *
 * Il permet :
 * - de récupérer les informations d'un profil 
 * - de modifier le prénom et le nom 
 * - d'ajouter ou modifier une photo de profil 
 * - de retourner les informations mises à jour au frontend
 */
class ProfileController
{
    /**
     * Récupère les informations du profil d'un utilisateur.
     */
    #[Route('/api/profile/{id}', name: 'api_profile_show', methods: ['GET'])]
    public function getProfile(
        int $id,
        Request $request,
        UserRepository $userRepository
    ): JsonResponse {
        try {
            // Recherche de l'utilisateur à partir de son identifiant
            $user = $userRepository->find($id);

            // Si aucun utilisateur n'est trouvé, retourne une erreur 404
            if (!$user) {
                return new JsonResponse(['message' => 'User not found'], 404);
            }

            // Retourne les informations du profil au format JSON
            return new JsonResponse([
                'id' => $user->getId(),
                'firstName' => $user->getFirstName(),
                'lastName' => $user->getLastName(),
                'email' => $user->getEmail(),
                'jobTitle' => $user->getJobTitle(),
                'department' => $user->getDepartment(),

                // Si une photo existe, on construit une URL complète
                'photo' => $user->getPhoto()
                    ? $request->getSchemeAndHttpHost() . $user->getPhoto()
                    : null,

                'roles' => $user->getRoles(),
            ]);
        } catch (\Throwable $e) {
            // Gestion des erreurs serveur
            return new JsonResponse([
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Met à jour les informations du profil.
     *
     * Les données sont reçues en multipart/form-data
     * afin de permettre l'envoi d'une image.
     */
    #[Route('/api/profile/{id}', name: 'api_profile_update', methods: ['POST'])]
    public function updateProfile(
        int $id,
        Request $request,
        UserRepository $userRepository,
        EntityManagerInterface $entityManager
    ): JsonResponse {
        try {
            // Recherche de l'utilisateur à modifier
            $user = $userRepository->find($id);

            if (!$user) {
                return new JsonResponse(['message' => 'User not found'], 404);
            }

            // Récupération et nettoyage des champs texte
            $firstName = trim((string) $request->request->get('firstName', ''));
            $lastName = trim((string) $request->request->get('lastName', ''));

            // Récupération de la photo envoyée
            /** @var UploadedFile|null $photoFile */
            $photoFile = $request->files->get('photoFile');

            // Vérifie que le prénom n'est pas vide
            if ($firstName === '') {
                return new JsonResponse(['message' => 'First name cannot be empty'], 400);
            }

            // Vérifie que le nom n'est pas vide
            if ($lastName === '') {
                return new JsonResponse(['message' => 'Last name cannot be empty'], 400);
            }

            // Mise à jour du prénom et du nom
            $user->setFirstName($firstName);
            $user->setLastName($lastName);

            /**
             * Traitement de la photo si un fichier est envoyé.
             */
            if ($photoFile) {
                // Extensions autorisées pour la photo de profil
                $allowedExtensions = ['jpg', 'jpeg', 'png', 'webp'];

                // Récupération de l'extension du fichier
                $extension = strtolower((string) $photoFile->getClientOriginalExtension());

                // Vérifie que le format est autorisé
                if (!in_array($extension, $allowedExtensions, true)) {
                    return new JsonResponse([
                        'message' => 'Only JPG, PNG or WEBP files are allowed'
                    ], 400);
                }

                // Vérifie que la taille ne dépasse pas 5 Mo
                if ($photoFile->getSize() > 5 * 1024 * 1024) {
                    return new JsonResponse([
                        'message' => 'Image must be less than 5MB'
                    ], 400);
                }

                // Dossier dans lequel les photos sont enregistrées
                $uploadDir = dirname(__DIR__, 2) . '/public/uploads';

                // Vérifie que le dossier d'upload existe
                if (!is_dir($uploadDir)) {
                    return new JsonResponse([
                        'message' => 'Uploads folder is missing. Please create backend/public/uploads manually.'
                    ], 500);
                }

                // Nettoyage du nom original du fichier
                $originalName = pathinfo($photoFile->getClientOriginalName(), PATHINFO_FILENAME);
                $safeName = preg_replace('/[^A-Za-z0-9_-]/', '-', $originalName);
                $safeName = trim((string) $safeName, '-');

                // Nom par défaut si le nom original est vide après nettoyage
                $safeName = $safeName !== '' ? $safeName : 'photo';

                // Génération d'un nom unique pour éviter les conflits
                $newFilename = $safeName . '-' . uniqid('', true) . '.' . $extension;

                // Déplacement du fichier dans le dossier public/uploads
                $photoFile->move($uploadDir, $newFilename);

                // Enregistrement du chemin de la photo dans l'utilisateur
                $user->setPhoto('/uploads/' . $newFilename);
            }

            // Sauvegarde des modifications en base de données
            $entityManager->flush();

            // Retour des nouvelles informations utilisateur au frontend
            return new JsonResponse([
                'message' => 'Profile updated successfully',
                'user' => [
                    'id' => $user->getId(),
                    'firstName' => $user->getFirstName(),
                    'lastName' => $user->getLastName(),
                    'email' => $user->getEmail(),
                    'jobTitle' => $user->getJobTitle(),
                    'department' => $user->getDepartment(),

                    // URL complète de la photo mise à jour
                    'photo' => $user->getPhoto()
                        ? $request->getSchemeAndHttpHost() . $user->getPhoto()
                        : null,

                    'roles' => $user->getRoles(),
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