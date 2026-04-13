<?php

namespace App\Controller;

use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

class ProfileController
{
    #[Route('/api/profile/{id}', name: 'api_profile_show', methods: ['GET'])]
    public function getProfile(
        int $id,
        Request $request,
        UserRepository $userRepository
    ): JsonResponse {
        try {
            $user = $userRepository->find($id);

            if (!$user) {
                return new JsonResponse(['message' => 'User not found'], 404);
            }

            return new JsonResponse([
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
            ]);
        } catch (\Throwable $e) {
            return new JsonResponse([
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    #[Route('/api/profile/{id}', name: 'api_profile_update', methods: ['POST'])]
    public function updateProfile(
        int $id,
        Request $request,
        UserRepository $userRepository,
        EntityManagerInterface $entityManager
    ): JsonResponse {
        try {
            $user = $userRepository->find($id);

            if (!$user) {
                return new JsonResponse(['message' => 'User not found'], 404);
            }

            $firstName = trim((string) $request->request->get('firstName', ''));
            $lastName = trim((string) $request->request->get('lastName', ''));

            /** @var UploadedFile|null $photoFile */
            $photoFile = $request->files->get('photoFile');

            if ($firstName === '') {
                return new JsonResponse(['message' => 'First name cannot be empty'], 400);
            }

            if ($lastName === '') {
                return new JsonResponse(['message' => 'Last name cannot be empty'], 400);
            }

            $user->setFirstName($firstName);
            $user->setLastName($lastName);

            if ($photoFile) {
                $allowedExtensions = ['jpg', 'jpeg', 'png', 'webp'];
                $extension = strtolower((string) $photoFile->getClientOriginalExtension());

                if (!in_array($extension, $allowedExtensions, true)) {
                    return new JsonResponse([
                        'message' => 'Only JPG, PNG or WEBP files are allowed'
                    ], 400);
                }

                if ($photoFile->getSize() > 5 * 1024 * 1024) {
                    return new JsonResponse([
                        'message' => 'Image must be less than 5MB'
                    ], 400);
                }

                $uploadDir = dirname(__DIR__, 2) . '/public/uploads';

                if (!is_dir($uploadDir)) {
                    return new JsonResponse([
                        'message' => 'Uploads folder is missing. Please create backend/public/uploads manually.'
                    ], 500);
                }

                $originalName = pathinfo($photoFile->getClientOriginalName(), PATHINFO_FILENAME);
                $safeName = preg_replace('/[^A-Za-z0-9_-]/', '-', $originalName);
                $safeName = trim((string) $safeName, '-');
                $safeName = $safeName !== '' ? $safeName : 'photo';

                $newFilename = $safeName . '-' . uniqid('', true) . '.' . $extension;

                $photoFile->move($uploadDir, $newFilename);

                $user->setPhoto('/uploads/' . $newFilename);
            }

            $entityManager->flush();

            return new JsonResponse([
                'message' => 'Profile updated successfully',
                'user' => [
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
                ]
            ]);
        } catch (\Throwable $e) {
            return new JsonResponse([
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}