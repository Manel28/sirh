<?php

namespace App\Controller;

use App\Entity\Document;
use App\Entity\Notification;
use App\Entity\User;
use App\Repository\DocumentRepository;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;
use Symfony\Component\Security\Http\Attribute\IsGranted;

/**
 * Gere les metadonnees Doctrine et les fichiers PDF stockes sur le serveur.
 */
class DocumentController extends AbstractController
{
    #[Route('/api/documents', methods: ['GET'])]
    public function list(
        #[CurrentUser] User $user,
        DocumentRepository $documentRepository
    ): JsonResponse {
        // Le role determine le filtre : tous les documents pour le RH, les siens sinon.
        $documents = in_array('ROLE_ADMIN', $user->getRoles(), true)
            ? $documentRepository->findBy([], ['createdAt' => 'DESC'])
            : $documentRepository->findBy(['user' => $user], ['createdAt' => 'DESC']);

        return new JsonResponse(array_map(
            fn (Document $document) => $this->formatDocument($document),
            $documents
        ));
    }

    #[Route('/api/documents', methods: ['POST'])]
    // IsGranted bloque l'appel avant cette methode si le JWT n'appartient pas a un RH.
    #[IsGranted('ROLE_ADMIN')]
    public function upload(
        Request $request,
        UserRepository $userRepository,
        EntityManagerInterface $entityManager
    ): JsonResponse {
        try {
            // Un upload utilise multipart/form-data : metadonnees et fichier sont separes.
            $title = trim((string) $request->request->get('title', ''));
            $category = trim((string) $request->request->get('category', ''));
            $userId = $request->request->get('userId');

            /** @var UploadedFile|null $file */
            $file = $request->files->get('file');

            if ($title === '' || $category === '' || !$userId || !$file) {
                return new JsonResponse(['message' => 'Missing required fields'], 400);
            }

            if (!$file->isValid()) {
                $message = in_array(
                    $file->getError(),
                    [UPLOAD_ERR_INI_SIZE, UPLOAD_ERR_FORM_SIZE],
                    true
                )
                    ? 'The PDF must be smaller than 10MB'
                    : 'The PDF upload failed';

                return new JsonResponse(['message' => $message], 400);
            }

            // L'id sert uniquement a retrouver l'entite User cible cote backend.
            $user = $userRepository->find($userId);

            if (!$user) {
                return new JsonResponse(['message' => 'User not found'], 404);
            }

            if (!in_array($file->getMimeType(), ['application/pdf', 'application/x-pdf'], true)) {
                return new JsonResponse(['message' => 'Only PDF files are allowed'], 400);
            }

            $fileSize = $file->getSize() ?? 0;

            if ($fileSize <= 0 || $fileSize > 10 * 1024 * 1024) {
                return new JsonResponse(['message' => 'The PDF must be smaller than 10MB'], 400);
            }

            // Le fichier recoit un nom aleatoire pour eviter les collisions et les noms dangereux.
            $uploadDir = $this->getParameter('kernel.project_dir') . '/public/uploads/documents';

            if (!is_dir($uploadDir) && !mkdir($uploadDir, 0755, true) && !is_dir($uploadDir)) {
                throw new \RuntimeException('Unable to create the document directory.');
            }

            $fileName = bin2hex(random_bytes(16)) . '.pdf';
            $file->move($uploadDir, $fileName);

            // L'entite Document stocke les metadonnees ; le contenu reste dans public/uploads.
            $document = (new Document())
                ->setTitle($title)
                ->setCategory($category)
                ->setFilePath('/uploads/documents/' . $fileName)
                ->setFileType('application/pdf')
                ->setFileSize(number_format($fileSize / 1024, 1) . ' KB')
                ->setCreatedAt(new \DateTime())
                ->setUser($user);

            $notification = (new Notification())
                ->setUser($user)
                ->setTitle('New document available')
                ->setMessage(sprintf('A new document "%s" has been uploaded to your account.', $title))
                ->setType('document')
                ->setIsRead(false)
                ->setCreatedAt(new \DateTime());

            $entityManager->persist($document);
            $entityManager->persist($notification);
            // flush execute ensemble les INSERT du document et de sa notification.
            $entityManager->flush();

            return new JsonResponse([
                'message' => 'Document uploaded successfully',
                'id' => $document->getId(),
            ], 201);
        } catch (\Throwable) {
            return new JsonResponse(['message' => 'Server error while uploading document'], 500);
        }
    }

    #[Route('/api/documents/{id}', methods: ['PUT'])]
    #[IsGranted('ROLE_ADMIN')]
    public function update(
        int $id,
        Request $request,
        DocumentRepository $documentRepository,
        UserRepository $userRepository,
        EntityManagerInterface $entityManager
    ): JsonResponse {
        try {
            // PUT modifie les metadonnees et le proprietaire, sans remplacer le PDF.
            $document = $documentRepository->find($id);

            if (!$document) {
                return new JsonResponse(['message' => 'Document not found'], 404);
            }

            $data = json_decode($request->getContent(), true);
            $title = is_array($data) ? trim((string) ($data['title'] ?? '')) : '';
            $category = is_array($data) ? trim((string) ($data['category'] ?? '')) : '';
            $userId = is_array($data) ? ($data['userId'] ?? null) : null;

            if ($title === '' || $category === '' || !$userId) {
                return new JsonResponse(['message' => 'Missing required fields'], 400);
            }

            $user = $userRepository->find($userId);

            if (!$user) {
                return new JsonResponse(['message' => 'User not found'], 404);
            }

            $document->setTitle($title);
            $document->setCategory($category);
            $document->setUser($user);
            $entityManager->flush();

            return new JsonResponse(['message' => 'Document updated successfully']);
        } catch (\Throwable) {
            return new JsonResponse(['message' => 'Server error while updating document'], 500);
        }
    }

    #[Route('/api/documents/{id}', methods: ['DELETE'])]
    #[IsGranted('ROLE_ADMIN')]
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

            $uploadDir = realpath($this->getParameter('kernel.project_dir') . '/public/uploads/documents');
            $filePath = realpath($this->getParameter('kernel.project_dir') . '/public' . $document->getFilePath());

            // realpath et le prefixe verifient que la suppression reste dans le dossier autorise.
            if (
                $uploadDir &&
                $filePath &&
                str_starts_with($filePath, $uploadDir . DIRECTORY_SEPARATOR)
            ) {
                unlink($filePath);
            }

            // Supprime ensuite la ligne Doctrine correspondant au fichier.
            $entityManager->remove($document);
            $entityManager->flush();

            return new JsonResponse(['message' => 'Document deleted successfully']);
        } catch (\Throwable) {
            return new JsonResponse(['message' => 'Server error while deleting document'], 500);
        }
    }

    private function formatDocument(Document $document): array
    {
        // Transforme l'entite et sa relation User en JSON sans exposer l'objet Doctrine.
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
    }
}
