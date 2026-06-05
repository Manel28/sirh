<?php

namespace App\Controller;

use App\Entity\Document;
use App\Repository\DocumentRepository;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

class DocumentController extends AbstractController
{
    #[Route('/api/documents', methods: ['GET'])]
    public function list(
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

            $documents = $isAdmin
                ? $documentRepository->findBy([], ['createdAt' => 'DESC'])
                : $documentRepository->findBy(['user' => $user], ['createdAt' => 'DESC']);

            $data = array_map(function (Document $document) {
                $owner = $document->getUser();

                return [
                    'id' => $document->getId(),
                    'title' => $document->getTitle(),
                    'category' => $document->getCategory(),
                    'filePath' => $document->getFilePath(),
                    'fileType' => $document->getFileType(),
                    'fileSize' => $document->getFileSize(),
                    'createdAt' => $document->getCreatedAt()?->format('Y-m-d H:i'),
                    'user' => [
                        'id' => $owner?->getId(),
                        'firstName' => $owner?->getFirstName(),
                        'lastName' => $owner?->getLastName(),
                        'email' => $owner?->getEmail(),
                    ],
                ];
            }, $documents);

            return new JsonResponse($data);
        } catch (\Throwable $e) {
            return new JsonResponse([
                'message' => 'Server error while loading documents',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    #[Route('/api/documents', methods: ['POST'])]
    public function upload(
        Request $request,
        UserRepository $userRepository,
        EntityManagerInterface $entityManager
    ): JsonResponse {
        try {
            $title = $request->request->get('title');
            $category = $request->request->get('category');
            $userId = $request->request->get('userId');

            /** @var UploadedFile|null $file */
            $file = $request->files->get('file');

            if (!$title || !$category || !$userId || !$file) {
                return new JsonResponse(['message' => 'Missing required fields'], 400);
            }

            $user = $userRepository->find($userId);

            if (!$user) {
                return new JsonResponse(['message' => 'User not found'], 404);
            }

            $extension = strtolower($file->getClientOriginalExtension());

            if ($extension !== 'pdf') {
                return new JsonResponse(['message' => 'Only PDF files are allowed'], 400);
            }

            $uploadDir = $this->getParameter('kernel.project_dir') . '/public/uploads/documents';

            if (!is_dir($uploadDir)) {
                mkdir($uploadDir, 0777, true);
            }

            $fileName = uniqid('document_', true) . '.pdf';

            $file->move($uploadDir, $fileName);

            $document = new Document();
            $document->setTitle($title);
            $document->setCategory($category);
            $document->setFilePath('/uploads/documents/' . $fileName);
            $document->setFileType('application/pdf');
            $document->setFileSize('PDF');
            $document->setCreatedAt(new \DateTime());
            $document->setUser($user);

            $entityManager->persist($document);
            $entityManager->flush();

            return new JsonResponse([
                'message' => 'Document uploaded successfully',
                'id' => $document->getId(),
            ], 201);
        } catch (\Throwable $e) {
            return new JsonResponse([
                'message' => 'Server error while uploading document',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    #[Route('/api/documents/{id}', methods: ['PUT'])]
    public function update(
        int $id,
        Request $request,
        DocumentRepository $documentRepository,
        UserRepository $userRepository,
        EntityManagerInterface $entityManager
    ): JsonResponse {
        try {
            $document = $documentRepository->find($id);

            if (!$document) {
                return new JsonResponse(['message' => 'Document not found'], 404);
            }

            $data = json_decode($request->getContent(), true);

            if (!$data) {
                return new JsonResponse(['message' => 'Invalid data'], 400);
            }

            if (
                empty($data['title']) ||
                empty($data['category']) ||
                empty($data['userId'])
            ) {
                return new JsonResponse(['message' => 'Missing required fields'], 400);
            }

            $user = $userRepository->find($data['userId']);

            if (!$user) {
                return new JsonResponse(['message' => 'User not found'], 404);
            }

            $document->setTitle(trim($data['title']));
            $document->setCategory(trim($data['category']));
            $document->setUser($user);

            $entityManager->flush();

            return new JsonResponse([
                'message' => 'Document updated successfully',
            ]);
        } catch (\Throwable $e) {
            return new JsonResponse([
                'message' => 'Server error while updating document',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    #[Route('/api/documents/{id}', methods: ['DELETE'])]
    public function delete(
        int $id,
        DocumentRepository $documentRepository,
        EntityManagerInterface $entityManager
    ): JsonResponse {
        try {
            $document = $documentRepository->find($id);

            if (!$document) {
                return new JsonResponse(['message' => 'Document not found'], 404);
            }

            $filePath = $this->getParameter('kernel.project_dir') .
                '/public' .
                $document->getFilePath();

            if (file_exists($filePath)) {
                unlink($filePath);
            }

            $entityManager->remove($document);
            $entityManager->flush();

            return new JsonResponse([
                'message' => 'Document deleted successfully',
            ]);
        } catch (\Throwable $e) {
            return new JsonResponse([
                'message' => 'Server error while deleting document',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}