<?php

namespace App\Controller;

use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;

/**
 * Consulte et modifie le profil de l'utilisateur identifie par son JWT.
 */
class ProfileController
{
    // Retourne directement le profil de CurrentUser, sans accepter d'id du frontend.
    #[Route('/api/profile', name: 'api_profile_show', methods: ['GET'])]
    public function getProfile(#[CurrentUser] User $user, Request $request): JsonResponse
    {
        return new JsonResponse($this->formatUser($user, $request));
    }

    #[Route('/api/profile', name: 'api_profile_update', methods: ['POST'])]
    public function updateProfile(
        #[CurrentUser] User $user,
        Request $request,
        EntityManagerInterface $entityManager
    ): JsonResponse {
        try {
            // Cette route recoit un FormData : champs texte dans request et photo dans files.
            $firstName = trim((string) $request->request->get('firstName', ''));
            $lastName = trim((string) $request->request->get('lastName', ''));

            if ($firstName === '' || $lastName === '') {
                return new JsonResponse(['message' => 'First name and last name are required.'], 400);
            }

            $user->setFirstName($firstName);
            $user->setLastName($lastName);

            /** @var UploadedFile|null $photoFile */
            $photoFile = $request->files->get('photoFile');

            if ($photoFile) {
                // La liste blanche MIME et la taille maximale bloquent les fichiers inattendus.
                $extensionsByMime = [
                    'image/jpeg' => 'jpg',
                    'image/png' => 'png',
                    'image/webp' => 'webp',
                ];
                $mimeType = (string) $photoFile->getMimeType();

                if (!isset($extensionsByMime[$mimeType])) {
                    return new JsonResponse(['message' => 'Only JPG, PNG or WEBP files are allowed.'], 400);
                }

                if (($photoFile->getSize() ?? 0) > 5 * 1024 * 1024) {
                    return new JsonResponse(['message' => 'Image must be less than 5MB.'], 400);
                }

                $uploadDir = dirname(__DIR__, 2) . '/public/uploads';

                if (!is_dir($uploadDir) && !mkdir($uploadDir, 0755, true) && !is_dir($uploadDir)) {
                    throw new \RuntimeException('Unable to create the upload directory.');
                }

                $newFilename = bin2hex(random_bytes(16)) . '.' . $extensionsByMime[$mimeType];
                $photoFile->move($uploadDir, $newFilename);
                $user->setPhoto('/uploads/' . $newFilename);
            }

            // User existe deja en base et est suivi par Doctrine : pas de persist necessaire.
            $entityManager->flush();

            return new JsonResponse([
                'message' => 'Profile updated successfully',
                'user' => $this->formatUser($user, $request),
            ]);
        } catch (\Throwable) {
            return new JsonResponse(['message' => 'Server error while updating profile.'], 500);
        }
    }

    private function formatUser(User $user, Request $request): array
    {
        // Convertit l'entite PHP en structure JSON simple comprise par React.
        return [
            'id' => $user->getId(),
            'firstName' => $user->getFirstName(),
            'lastName' => $user->getLastName(),
            'email' => $user->getEmail(),
            'jobTitle' => $user->getJobTitle(),
            'department' => $user->getDepartment(),
            'photo' => $user->getPhoto()
                ? $request->getSchemeAndHttpHost() . $user->getPhoto()
                : null,
            'roles' => $user->getRoles(),
            'mustChangePassword' => $user->isMustChangePassword(),
        ];
    }
}
