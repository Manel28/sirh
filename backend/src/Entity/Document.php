<?php

namespace App\Entity;

use App\Repository\DocumentRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

/**
 * Entité Document.
 *
 * Cette entité représente un document RH stocké dans l'application.
 * Un document est associé à un utilisateur et contient les informations
 * nécessaires pour l'affichage et le téléchargement du fichier.
 */
#[ORM\Entity(repositoryClass: DocumentRepository::class)]
#[ORM\Table(name: 'document')]
class Document
{
    /**
     * Identifiant unique du document.
     */
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    /**
     * Titre du document.
     *
     * Exemple :
     * - Fiche de paie janvier
     * - Contrat de travail
     */
    #[ORM\Column(length: 255)]
    private ?string $title = null;

    /**
     * Catégorie du document.
     *
     * Exemple :
     * - Payroll
     * - Administrative
     * - Training
     */
    #[ORM\Column(length: 100)]
    private ?string $category = null;

    /**
     * Chemin du fichier stocké côté serveur.
     */
    #[ORM\Column(length: 255)]
    private ?string $filePath = null;

    /**
     * Type MIME du fichier.
     *
     * Exemple : application/pdf
     */
    #[ORM\Column(length: 50)]
    private ?string $fileType = null;

    /**
     * Taille du fichier.
     */
    #[ORM\Column(length: 50, nullable: true)]
    private ?string $fileSize = null;

    /**
     * Date de création ou d'upload du document.
     */
    #[ORM\Column(type: Types::DATETIME_MUTABLE)]
    private ?\DateTimeInterface $createdAt = null;

    /**
     * Utilisateur propriétaire du document.
     *
     * Relation ManyToOne :
     * - un document appartient à un seul utilisateur 
     * - un utilisateur peut posséder plusieurs documents
     *
     * onDelete CASCADE permet de supprimer les documents
     * si l'utilisateur associé est supprimé
     */
    #[ORM\ManyToOne(targetEntity: User::class, inversedBy: 'documents')]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private ?User $user = null;

    /**
     * Retourne l'identifiant du document.
     */
    public function getId(): ?int
    {
        return $this->id;
    }

    /**
     * Retourne le titre du document.
     */
    public function getTitle(): ?string
    {
        return $this->title;
    }

    /**
     * Modifie le titre du document.
     */
    public function setTitle(string $title): static
    {
        $this->title = $title;

        return $this;
    }

    /**
     * Retourne la catégorie du document.
     */
    public function getCategory(): ?string
    {
        return $this->category;
    }

    /**
     * Modifie la catégorie du document.
     */
    public function setCategory(string $category): static
    {
        $this->category = $category;

        return $this;
    }

    /**
     * Retourne le chemin du fichier.
     */
    public function getFilePath(): ?string
    {
        return $this->filePath;
    }

    /**
     * Modifie le chemin du fichier.
     */
    public function setFilePath(string $filePath): static
    {
        $this->filePath = $filePath;

        return $this;
    }

    /**
     * Retourne le type MIME du fichier.
     */
    public function getFileType(): ?string
    {
        return $this->fileType;
    }

    /**
     * Modifie le type MIME du fichier.
     */
    public function setFileType(string $fileType): static
    {
        $this->fileType = $fileType;

        return $this;
    }

    /**
     * Retourne la taille du fichier.
     */
    public function getFileSize(): ?string
    {
        return $this->fileSize;
    }

    /**
     * Modifie la taille du fichier.
     */
    public function setFileSize(?string $fileSize): static
    {
        $this->fileSize = $fileSize;

        return $this;
    }

    /**
     * Retourne la date de création du document.
     */
    public function getCreatedAt(): ?\DateTimeInterface
    {
        return $this->createdAt;
    }

    /**
     * Modifie la date de création du document.
     */
    public function setCreatedAt(\DateTimeInterface $createdAt): static
    {
        $this->createdAt = $createdAt;

        return $this;
    }

    /**
     * Retourne l'utilisateur propriétaire du document.
     */
    public function getUser(): ?User
    {
        return $this->user;
    }

    /**
     * Associe le document à un utilisateur.
     */
    public function setUser(?User $user): static
    {
        $this->user = $user;

        return $this;
    }
}