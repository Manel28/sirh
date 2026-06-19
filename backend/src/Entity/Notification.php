<?php

namespace App\Entity;

use App\Repository\NotificationRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

/**
 * Entité Notification.
 *
 * Cette entité représente une notification envoyée
 * à un utilisateur de l'application.
 *
 * Les notifications sont utilisées pour informer
 * les collaborateurs et les administrateurs des événements 
 * - demande de congé 
 * - validation ou refus d'un congé 
 * - ajout d'un document 
 * - autres actions importantes du système
 */
#[ORM\Entity(repositoryClass: NotificationRepository::class)]
class Notification
{
    /**
     * Identifiant unique de la notification.
     */
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    /**
     * Utilisateur destinataire de la notification.
     *
     * Relation ManyToOne :
     * - un utilisateur peut recevoir plusieurs notifications ;
     * - une notification appartient à un seul utilisateur.
     *
     * La suppression d'un utilisateur entraîne
     * automatiquement la suppression de ses notifications.
     */
    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private ?User $user = null;

    /**
     * Titre de la notification.
     */
    #[ORM\Column(length: 255)]
    private ?string $title = null;

    /**
     * Message détaillé de la notification.
     */
    #[ORM\Column(type: Types::TEXT)]
    private ?string $message = null;

    /**
     * Type de notification.
     *
     * Exemples :
     * - leave
     * - document
     * - calendar
     */
    #[ORM\Column(length: 50)]
    private ?string $type = null;

    /**
     * Indique si la notification a été lue.
     *
     * false = non lue
     * true = lue
     */
    #[ORM\Column(type: 'boolean')]
    private bool $isRead = false;

    /**
     * Date de création de la notification.
     */
    #[ORM\Column(type: Types::DATETIME_MUTABLE)]
    private ?\DateTimeInterface $createdAt = null;

    /**
     * Retourne l'identifiant de la notification.
     */
    public function getId(): ?int
    {
        return $this->id;
    }

    /**
     * Retourne l'utilisateur destinataire.
     */
    public function getUser(): ?User
    {
        return $this->user;
    }

    /**
     * Associe la notification à un utilisateur.
     */
    public function setUser(?User $user): static
    {
        $this->user = $user;

        return $this;
    }

    /**
     * Retourne le titre de la notification.
     */
    public function getTitle(): ?string
    {
        return $this->title;
    }

    /**
     * Modifie le titre de la notification.
     */
    public function setTitle(string $title): static
    {
        $this->title = $title;

        return $this;
    }

    /**
     * Retourne le contenu du message.
     */
    public function getMessage(): ?string
    {
        return $this->message;
    }

    /**
     * Modifie le contenu du message.
     */
    public function setMessage(string $message): static
    {
        $this->message = $message;

        return $this;
    }

    /**
     * Retourne le type de notification.
     */
    public function getType(): ?string
    {
        return $this->type;
    }

    /**
     * Modifie le type de notification.
     */
    public function setType(string $type): static
    {
        $this->type = $type;

        return $this;
    }

    /**
     * Indique si la notification a été lue.
     */
    public function isRead(): bool
    {
        return $this->isRead;
    }

    /**
     * Modifie l'état de lecture de la notification.
     */
    public function setIsRead(bool $isRead): static
    {
        $this->isRead = $isRead;

        return $this;
    }

    /**
     * Retourne la date de création.
     */
    public function getCreatedAt(): ?\DateTimeInterface
    {
        return $this->createdAt;
    }

    /**
     * Modifie la date de création.
     */
    public function setCreatedAt(\DateTimeInterface $createdAt): static
    {
        $this->createdAt = $createdAt;

        return $this;
    }
}