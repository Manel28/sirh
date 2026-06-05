<?php

namespace App\Entity;

use App\Repository\UserRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Security\Core\User\PasswordAuthenticatedUserInterface;
use Symfony\Component\Security\Core\User\UserInterface;

#[ORM\Entity(repositoryClass: UserRepository::class)]
#[ORM\UniqueConstraint(name: 'UNIQ_IDENTIFIER_EMAIL', fields: ['email'])]
#[ORM\Table(name: 'user')]
class User implements UserInterface, PasswordAuthenticatedUserInterface
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 180)]
    private ?string $email = null;

    #[ORM\Column]
    private array $roles = [];

    #[ORM\Column]
    private ?string $password = null;

    #[ORM\Column(type: 'boolean')]
    private bool $mustChangePassword = false;

    #[ORM\Column(length: 100, nullable: true)]
    private ?string $firstName = null;

    #[ORM\Column(length: 100, nullable: true)]
    private ?string $lastName = null;

    #[ORM\Column(length: 150, nullable: true)]
    private ?string $jobTitle = null;

    #[ORM\Column(length: 150, nullable: true)]
    private ?string $department = null;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $photo = null;

    #[ORM\Column]
    private int $leaveBalance = 25;

    #[ORM\OneToMany(targetEntity: Leave::class, mappedBy: 'user')]
    private Collection $leaves;

    #[ORM\OneToMany(targetEntity: WorkEntry::class, mappedBy: 'user', orphanRemoval: true)]
    private Collection $workEntries;

    #[ORM\OneToMany(targetEntity: Document::class, mappedBy: 'user', orphanRemoval: true)]
    private Collection $documents;

    public function __construct()
    {
        $this->leaves = new ArrayCollection();
        $this->workEntries = new ArrayCollection();
        $this->documents = new ArrayCollection();
    }

    public function getId(): ?int { return $this->id; }

    public function getEmail(): ?string { return $this->email; }

    public function setEmail(string $email): static
    {
        $this->email = $email;
        return $this;
    }

    public function getUserIdentifier(): string
    {
        return (string) $this->email;
    }

    public function getRoles(): array
    {
        $roles = $this->roles;
        $roles[] = 'ROLE_USER';
        return array_unique($roles);
    }

    public function setRoles(array $roles): static
    {
        $this->roles = $roles;
        return $this;
    }

    public function getPassword(): ?string { return $this->password; }

    public function setPassword(string $password): static
    {
        $this->password = $password;
        return $this;
    }

    public function isMustChangePassword(): bool
    {
        return $this->mustChangePassword;
    }

    public function setMustChangePassword(bool $mustChangePassword): static
    {
        $this->mustChangePassword = $mustChangePassword;
        return $this;
    }

    public function getFirstName(): ?string { return $this->firstName; }

    public function setFirstName(?string $firstName): static
    {
        $this->firstName = $firstName;
        return $this;
    }

    public function getLastName(): ?string { return $this->lastName; }

    public function setLastName(?string $lastName): static
    {
        $this->lastName = $lastName;
        return $this;
    }

    public function getJobTitle(): ?string { return $this->jobTitle; }

    public function setJobTitle(?string $jobTitle): static
    {
        $this->jobTitle = $jobTitle;
        return $this;
    }

    public function getDepartment(): ?string { return $this->department; }

    public function setDepartment(?string $department): static
    {
        $this->department = $department;
        return $this;
    }

    public function getPhoto(): ?string { return $this->photo; }

    public function setPhoto(?string $photo): static
    {
        $this->photo = $photo;
        return $this;
    }

    public function getLeaveBalance(): int
    {
        return $this->leaveBalance;
    }

    public function setLeaveBalance(int $leaveBalance): static
    {
        $this->leaveBalance = $leaveBalance;
        return $this;
    }

    public function __serialize(): array
    {
        $data = (array) $this;
        $data["\0" . self::class . "\0password"] = hash('crc32c', $this->password);
        return $data;
    }

    #[\Deprecated]
    public function eraseCredentials(): void {}

    public function getLeaves(): Collection { return $this->leaves; }

    public function addLeave(Leave $leave): static
    {
        if (!$this->leaves->contains($leave)) {
            $this->leaves->add($leave);
            $leave->setUser($this);
        }

        return $this;
    }

    public function removeLeave(Leave $leave): static
    {
        $this->leaves->removeElement($leave);
        return $this;
    }

    public function getWorkEntries(): Collection { return $this->workEntries; }

    public function addWorkEntry(WorkEntry $workEntry): static
    {
        if (!$this->workEntries->contains($workEntry)) {
            $this->workEntries->add($workEntry);
            $workEntry->setUser($this);
        }

        return $this;
    }

    public function removeWorkEntry(WorkEntry $workEntry): static
    {
        if ($this->workEntries->removeElement($workEntry)) {
            if ($workEntry->getUser() === $this) {
                $workEntry->setUser(null);
            }
        }

        return $this;
    }

    public function getDocuments(): Collection
    {
        return $this->documents;
    }

    public function addDocument(Document $document): static
    {
        if (!$this->documents->contains($document)) {
            $this->documents->add($document);
            $document->setUser($this);
        }

        return $this;
    }

    public function removeDocument(Document $document): static
    {
        if ($this->documents->removeElement($document)) {
            if ($document->getUser() === $this) {
                $document->setUser(null);
            }
        }

        return $this;
    }
}