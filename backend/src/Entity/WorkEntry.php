<?php

namespace App\Entity;

use App\Repository\WorkEntryRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: WorkEntryRepository::class)]
#[ORM\Table(name: 'work_entry')]
#[ORM\UniqueConstraint(name: 'uniq_user_date', columns: ['user_id', 'work_date'])]
class WorkEntry
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(type: Types::DATE_MUTABLE)]
    private ?\DateTimeInterface $workDate = null;

    #[ORM\Column(length: 10)]
    private ?string $code = null;

    #[ORM\ManyToOne(inversedBy: 'workEntries')]
    #[ORM\JoinColumn(nullable: false)]
    private ?User $user = null;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getWorkDate(): ?\DateTimeInterface
    {
        return $this->workDate;
    }

    public function setWorkDate(\DateTimeInterface $workDate): static
    {
        $this->workDate = $workDate;

        return $this;
    }

    public function getCode(): ?string
    {
        return $this->code;
    }

    public function setCode(string $code): static
    {
        $this->code = strtoupper(trim($code));

        return $this;
    }

    public function getUser(): ?User
    {
        return $this->user;
    }

    public function setUser(?User $user): static
    {
        $this->user = $user;

        return $this;
    }
}