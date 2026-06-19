<?php

namespace App\Entity;

use App\Repository\LeaveRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

/**
 * Entité Leave.
 *
 * Cette entité représente une demande de congé effectuée
 * par un collaborateur dans le système SIRH.
 *
 * Chaque demande contient :
 * - un type de congé 
 * - une date de début 
 * - une date de fin 
 * - un statut 
 * - un utilisateur associé
 */
#[ORM\Entity(repositoryClass: LeaveRepository::class)]
#[ORM\Table(name: 'leaves')]
class Leave
{
    /**
     * Identifiant unique de la demande de congé.
     */
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    /**
     * Type de congé.
     *
     * Exemples :
     * - Paid Leave
     * - Sick Leave
     * - Unpaid Leave
     */
    #[ORM\Column(length: 255)]
    private ?string $type = null;

    /**
     * Date de début du congé.
     */
    #[ORM\Column(type: Types::DATE_MUTABLE)]
    private ?\DateTimeInterface $startDate = null;

    /**
     * Date de fin du congé.
     */
    #[ORM\Column(type: Types::DATE_MUTABLE)]
    private ?\DateTimeInterface $endDate = null;

    /**
     * Statut de la demande.
     *
     * Exemples :
     * - Pending
     * - Approved
     * - Rejected
     * - Cancelled
     */
    #[ORM\Column(length: 50)]
    private ?string $status = null;

    /**
     * Utilisateur ayant effectué la demande.
     *
     * Relation ManyToOne :
     * - plusieurs demandes peuvent appartenir à un même utilisateur ;
     * - une demande appartient à un seul utilisateur.
     */
    #[ORM\ManyToOne(inversedBy: 'leaves')]
    #[ORM\JoinColumn(nullable: false)]
    private ?User $user = null;

    /**
     * Retourne l'identifiant de la demande.
     */
    public function getId(): ?int
    {
        return $this->id;
    }

    /**
     * Retourne le type de congé.
     */
    public function getType(): ?string
    {
        return $this->type;
    }

    /**
     * Modifie le type de congé.
     */
    public function setType(string $type): static
    {
        $this->type = $type;

        return $this;
    }

    /**
     * Retourne la date de début.
     */
    public function getStartDate(): ?\DateTimeInterface
    {
        return $this->startDate;
    }

    /**
     * Modifie la date de début.
     */
    public function setStartDate(\DateTimeInterface $startDate): static
    {
        $this->startDate = $startDate;

        return $this;
    }

    /**
     * Retourne la date de fin.
     */
    public function getEndDate(): ?\DateTimeInterface
    {
        return $this->endDate;
    }

    /**
     * Modifie la date de fin.
     */
    public function setEndDate(\DateTimeInterface $endDate): static
    {
        $this->endDate = $endDate;

        return $this;
    }

    /**
     * Retourne le statut de la demande.
     */
    public function getStatus(): ?string
    {
        return $this->status;
    }

    /**
     * Modifie le statut de la demande.
     */
    public function setStatus(string $status): static
    {
        $this->status = $status;

        return $this;
    }

    /**
     * Retourne l'utilisateur associé à la demande.
     */
    public function getUser(): ?User
    {
        return $this->user;
    }

    /**
     * Associe la demande à un utilisateur.
     */
    public function setUser(?User $user): static
    {
        $this->user = $user;

        return $this;
    }
}