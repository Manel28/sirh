<?php

namespace App\Controller;

use App\Entity\Document;
use App\Entity\Notification;
use App\Repository\DocumentRepository;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

/**
 * Contrôleur dédié à la gestion des documents RH.
 *
 * Il permet :
 * - de lister les documents accessibles à l'utilisateur 
 * - d'ajouter un document PDF 
 * - de modifier les informations d'un document 
 * - de supprimer un document 
 * - de créer une notification lorsqu'un document est ajouté
 */
class DocumentController extends AbstractController
{
    /**
     * Liste les documents accessibles à l'utilisateur connecté.
     *
     * Si l'utilisateur est administrateur/RH :
     * - tous les documents sont retournés.
     *
     * Si l'utilisateur est collaborateur :
     * - seuls ses propres documents sont retournés.
     */
    #[Route('/api/documents', methods: ['GET'])]
    public function list(
        Request $request,
        DocumentRepository $documentRepository,
        UserRepository $userRepository
    ): JsonResponse {
        try {
            // Récupération de l'identifiant utilisateur depuis les paramètres GET
            $userId = $request->query->get('userId');

            // Vérification de la présence du userId
            if (!$userId) {
                return new JsonResponse(['message' => 'Missing userId'], 400);
            }

            // Recherche de l'utilisateur en base de données
            $user = $userRepository->find($userId);

            if (!$user) {
                return new JsonResponse(['message' => 'User not found'], 404);
            }

            // Vérifie si l'utilisateur possède le rôle administrateur/RH
            $isAdmin = in_array('ROLE_ADMIN', $user->getRoles(), true);

            // Récupération des documents selon le rôle de l'utilisateur
            $documents = $isAdmin
                ? $documentRepository->findBy([], ['createdAt' => 'DESC'])
                : $documentRepository->findBy(['user' => $user], ['createdAt' => 'DESC']);

            // Transformation des entités Document en tableau JSON
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

            // Retour des documents au format JSON
            return new JsonResponse($data);
        } catch (\Throwable $e) {
            // Gestion des erreurs serveur
            return new JsonResponse([
                'message' => 'Server error while loading documents',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Ajoute un nouveau document PDF.
     *
     * Le fichier est stocké dans le dossier public/uploads/documents.
     * Une notification est créée pour l'utilisateur concerné.
     */
    #[Route('/api/documents', methods: ['POST'])]
    public function upload(
        Request $request,
        UserRepository $userRepository,
        EntityManagerInterface $entityManager
    ): JsonResponse {
        try {
            // Récupération des champs envoyés en multipart/form-data
            $title = $request->request->get('title');
            $category = $request->request->get('category');
            $userId = $request->request->get('userId');

            // Récupération du fichier envoyé
            /** @var UploadedFile|null $file */
            $file = $request->files->get('file');

            // Vérification des champs obligatoires
            if (!$title || !$category || !$userId || !$file) {
                return new JsonResponse(['message' => 'Missing required fields'], 400);
            }

            // Recherche de l'utilisateur propriétaire du document
            $user = $userRepository->find($userId);

            if (!$user) {
                return new JsonResponse(['message' => 'User not found'], 404);
            }

            // Vérification de l'extension du fichier
            $extension = strtolower($file->getClientOriginalExtension());

            if ($extension !== 'pdf') {
                return new JsonResponse(['message' => 'Only PDF files are allowed'], 400);
            }

            // Définition du dossier d'upload
            $uploadDir = $this->getParameter('kernel.project_dir') . '/public/uploads/documents';

            // Création du dossier s'il n'existe pas
            if (!is_dir($uploadDir)) {
                mkdir($uploadDir, 0777, true);
            }

            // Génération d'un nom unique pour éviter les conflits
            $fileName = uniqid('document_', true) . '.pdf';

            // Déplacement du fichier dans le dossier public
            $file->move($uploadDir, $fileName);

            // Création de l'entité Document
            $document = new Document();
            $document->setTitle($title);
            $document->setCategory($category);
            $document->setFilePath('/uploads/documents/' . $fileName);
            $document->setFileType('application/pdf');
            $document->setFileSize('PDF');
            $document->setCreatedAt(new \DateTime());
            $document->setUser($user);

            // Préparation de l'enregistrement du document
            $entityManager->persist($document);

            // Création d'une notification pour informer l'utilisateur
            $notification = new Notification();
            $notification->setUser($user);
            $notification->setTitle('New document available');
            $notification->setMessage(sprintf('A new document "%s" has been uploaded to your account.', $title));
            $notification->setType('document');
            $notification->setIsRead(false);
            $notification->setCreatedAt(new \DateTime());

            // Préparation de l'enregistrement de la notification
            $entityManager->persist($notification);

            // Sauvegarde en base de données
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

    /**
     * Met à jour les informations d'un document.
     *
     * Cette méthode modifie :
     * - le titre ;
     * - la catégorie ;
     * - l'utilisateur propriétaire.
     *
     * Elle ne remplace pas le fichier PDF.
     */
    #[Route('/api/documents/{id}', methods: ['PUT'])]
    public function update(
        int $id,
        Request $request,
        DocumentRepository $documentRepository,
        UserRepository $userRepository,
        EntityManagerInterface $entityManager
    ): JsonResponse {
        try {
            // Recherche du document à modifier
            $document = $documentRepository->find($id);

            if (!$document) {
                return new JsonResponse(['message' => 'Document not found'], 404);
            }

            // Décodage des données JSON envoyées par le frontend
            $data = json_decode($request->getContent(), true);

            if (!$data) {
                return new JsonResponse(['message' => 'Invalid data'], 400);
            }

            // Vérification des champs obligatoires
            if (
                empty($data['title']) ||
                empty($data['category']) ||
                empty($data['userId'])
            ) {
                return new JsonResponse(['message' => 'Missing required fields'], 400);
            }

            // Recherche de l'utilisateur à associer au document
            $user = $userRepository->find($data['userId']);

            if (!$user) {
                return new JsonResponse(['message' => 'User not found'], 404);
            }

            // Mise à jour des informations du document
            $document->setTitle(trim($data['title']));
            $document->setCategory(trim($data['category']));
            $document->setUser($user);

            // Sauvegarde des modifications
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

    /**
     * Supprime un document.
     *
     * Le fichier physique est supprimé du dossier public,
     * puis l'entrée correspondante est supprimée de la base de données.
     */
    #[Route('/api/documents/{id}', methods: ['DELETE'])]
    public function delete(
        int $id,
        DocumentRepository $documentRepository,
        EntityManagerInterface $entityManager
    ): JsonResponse {
        try {
            // Recherche du document à supprimer
            $document = $documentRepository->find($id);

            if (!$document) {
                return new JsonResponse(['message' => 'Document not found'], 404);
            }

            // Construction du chemin complet vers le fichier stocké
            $filePath = $this->getParameter('kernel.project_dir') .
                '/public' .
                $document->getFilePath();

            // Suppression du fichier physique s'il existe
            if (file_exists($filePath)) {
                unlink($filePath);
            }

            // Suppression de l'entité Document
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