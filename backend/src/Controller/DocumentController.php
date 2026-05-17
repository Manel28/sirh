<?php

namespace App\Controller;

use App\Entity\Document;
use App\Entity\Notification;
use App\Repository\DocumentRepository;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

class DocumentController
{
    #[Route('/api/documents', methods: ['GET'])]
    public function listDocuments(
        Request $request,
        DocumentRepository $documentRepository,
        UserRepository $userRepository
    ): JsonResponse {
        try {
            $userId = $request->query->get('userId');

            if (!$userId) {
                return new JsonResponse(['message' => 'Missing userId'], 400);
            }

            $user = $userRepository->find($userId);

            if (!$user) {
                return new JsonResponse(['message' => 'User not found'], 404);
            }

            $isAdmin = in_array('ROLE_ADMIN', $user->getRoles(), true);

            if ($isAdmin) {
                $documents = $documentRepository->findBy([], ['createdAt' => 'DESC']);
            } else {
                $documents = $documentRepository->findBy(
                    ['user' => $user],
                    ['createdAt' => 'DESC']
                );
            }

            $data = array_map(function (Document $document) use ($request) {
                return [
                    'id' => $document->getId(),
                    'title' => $document->getTitle(),
                    'category' => $document->getCategory(),
                    'filePath' => $request->getSchemeAndHttpHost() . $document->getFilePath(),
                    'fileType' => $document->getFileType(),
                    'fileSize' => $document->getFileSize(),
                    'createdAt' => $document->getCreatedAt()?->format('Y-m-d'),
                    'user' => [
                        'id' => $document->getUser()?->getId(),
                        'firstName' => $document->getUser()?->getFirstName(),
                        'lastName' => $document->getUser()?->getLastName(),
                        'email' => $document->getUser()?->getEmail(),
                    ],
                ];
            }, $documents);

            return new JsonResponse($data);
        } catch (\Throwable $e) {
            return new JsonResponse([
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    #[Route('/api/documents', methods: ['POST'])]
    public function uploadDocument(
        Request $request,
        EntityManagerInterface $entityManager,
        UserRepository $userRepository
    ): JsonResponse {
        try {
            $title = trim((string) $request->request->get('title', ''));
            $category = trim((string) $request->request->get('category', ''));
            $userId = $request->request->get('userId');

            /** @var UploadedFile|null $file */
            $file = $request->files->get('file');

            if ($title === '' || $category === '' || !$userId || !$file) {
                return new JsonResponse(['message' => 'Missing required data'], 400);
            }

            $user = $userRepository->find($userId);

            if (!$user) {
                return new JsonResponse(['message' => 'User not found'], 404);
            }

            $extension = strtolower((string) $file->getClientOriginalExtension());

            if ($extension !== 'pdf') {
                return new JsonResponse(['message' => 'Only PDF files are allowed'], 400);
            }

            $rawSize = (int) ($file->getSize() ?? 0);

            if ($rawSize <= 0) {
                return new JsonResponse(['message' => 'Unable to read uploaded file size'], 400);
            }

            if ($rawSize > 10 * 1024 * 1024) {
                return new JsonResponse(['message' => 'File must be less than 10 MB'], 400);
            }

            $uploadDir = dirname(__DIR__, 2) . '/public/uploads/documents';

            if (!is_dir($uploadDir)) {
                return new JsonResponse([
                    'message' => 'Documents folder is missing. Please create backend/public/uploads/documents manually.'
                ], 500);
            }

            $originalName = pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME);
            $safeName = preg_replace('/[^A-Za-z0-9_-]/', '-', $originalName);
            $safeName = trim((string) $safeName, '-');
            $safeName = $safeName !== '' ? $safeName : 'document';

            $newFilename = $safeName . '-' . uniqid('', true) . '.pdf';

            $file->move($uploadDir, $newFilename);

            $document = new Document();
            $document->setTitle($title);
            $document->setCategory($category);
            $document->setFilePath('/uploads/documents/' . $newFilename);
            $document->setFileType('PDF');
            $document->setFileSize($this->formatBytes($rawSize));
            $document->setCreatedAt(new \DateTime());
            $document->setUser($user);

            $entityManager->persist($document);

            $notification = new Notification();
            $notification->setUser($user);
            $notification->setTitle('New document available');
            $notification->setMessage(
                'A new ' . $category . ' document has been added to your account: ' . $title . '.'
            );
            $notification->setType('document');
            $notification->setIsRead(false);
            $notification->setCreatedAt(new \DateTime());

            $entityManager->persist($notification);

            $entityManager->flush();

            return new JsonResponse([
                'message' => 'Document uploaded successfully'
            ], 201);
        } catch (\Throwable $e) {
            return new JsonResponse([
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    private function formatBytes(int $bytes): string
    {
        if ($bytes >= 1024 * 1024) {
            return round($bytes / (1024 * 1024), 1) . ' MB';
        }

        return round($bytes / 1024) . ' KB';
    }
}