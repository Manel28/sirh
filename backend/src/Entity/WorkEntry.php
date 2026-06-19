<?php

namespace App\Entity;

use App\Repository\WorkEntryRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

/**
 * Entité WorkEntry.
 *
 * Cette entité représente une entrée du calendrier
 * de présence d'un collaborateur.
 *
 * Chaque entrée correspond à :
 * - un utilisateur 
 * - une date 
 * - un code de présence ou d'absence.
 *
 * Exemples de codes :
 * - SS : Sur Site
 * - TT : Télétravail
 * - TR : Formation
 * - AB : Absence
 * - LV : Congé validé (généré automatiquement)
 */
#[ORM\Entity(repositoryClass: WorkEntryRepository::class)]
#[ORM\Table(name: 'work_entry')]
#[ORM\UniqueConstraint(name: 'uniq_user_date', columns: ['user_id', 'work_date'])]
class WorkEntry
{
    /**
     * Identifiant unique de l'entrée.
     */
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    /**
     * Date concernée par l'entrée de calendrier.
     */
    #[ORM\Column(type: Types::DATE_MUTABLE)]
    private ?\DateTimeInterface $workDate = null;

    /**
     * Code associé à la journée.
     *
     * Exemples :
     * - SS
     * - TT
     * - TR
     * - AB
     */
    #[ORM\Column(length: 10)]
    private ?string $code = null;

    /**
     * Utilisateur associé à l'entrée.
     *
     * Relation ManyToOne :
     * - plusieurs entrées peuvent appartenir à un utilisateur ;
     * - une entrée appartient à un seul utilisateur.
     */
    #[ORM\ManyToOne(inversedBy: 'workEntries')]
    #[ORM\JoinColumn(nullable: false)]
    private ?User $user = null;

    /**
     * Retourne l'identifiant de l'entrée.
     */
    public function getId(): ?int
    {
        return $this->id;
    }

    /**
     * Retourne la date de l'entrée.
     */
    public function getWorkDate(): ?\DateTimeInterface
    {
        return $this->workDate;
    }

    /**
     * Modifie la date de l'entrée.
     */
    public function setWorkDate(\DateTimeInterface $workDate): static
    {
        $this->workDate = $workDate;

        return $this;
    }

    /**
     * Retourne le code associé à la journée.
     */
    public function getCode(): ?string
    {
        return $this->code;
    }

    /**
     * Modifie le code associé à la journée.
     *
     * Le code est automatiquement :
     * - nettoyé (trim) ;
     * - converti en majuscules.
     */
    public function setCode(string $code): static
    {
        $this->code = strtoupper(trim($code));

        return $this;
    }

    /**
     * Retourne l'utilisateur associé.
     */
    public function getUser(): ?User
    {
        return $this->user;
    }

    /**
     * Associe l'entrée à un utilisateur.
     */
    public function setUser(?User $user): static
    {
        $this->user = $user;

        return $this;
    }
}