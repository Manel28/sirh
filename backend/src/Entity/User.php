<?php

namespace App\Entity;

use App\Repository\UserRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Security\Core\User\PasswordAuthenticatedUserInterface;
use Symfony\Component\Security\Core\User\UserInterface;

/**
 * Entité User.
 *
 * Cette entité représente un utilisateur de l'application SIRH.
 *
 * Un utilisateur peut être :
 * - collaborateur ;
 * - administrateur/RH.
 *
 * Elle contient :
 * - les informations de connexion ;
 * - les informations personnelles 
 * - le rôle utilisateur 
 * - le solde de congés 
 * - les relations avec les congés, documents et entrées de calendrier.
 */
#[ORM\Entity(repositoryClass: UserRepository::class)]
#[ORM\UniqueConstraint(name: 'UNIQ_IDENTIFIER_EMAIL', fields: ['email'])]
#[ORM\Table(name: 'user')]
class User implements UserInterface, PasswordAuthenticatedUserInterface
{
    /**
     * Identifiant unique de l'utilisateur.
     */
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    /**
     * Adresse email de l'utilisateur.
     *
     * Elle est unique et sert d'identifiant de connexion.
     */
    #[ORM\Column(length: 180)]
    private ?string $email = null;

    /**
     * Rôles de l'utilisateur.
     *
     * Exemple :
     * - ROLE_USER
     * - ROLE_ADMIN
     */
    #[ORM\Column]
    private array $roles = [];

    /**
     * Mot de passe chiffré de l'utilisateur.
     */
    #[ORM\Column]
    private ?string $password = null;

    /**
     * Indique si l'utilisateur doit changer son mot de passe.
     *
     * Utilisé après la création d'un compte avec mot de passe temporaire.
     */
    #[ORM\Column(type: 'boolean')]
    private bool $mustChangePassword = false;

    /**
     * Prénom de l'utilisateur.
     */
    #[ORM\Column(length: 100, nullable: true)]
    private ?string $firstName = null;

    /**
     * Nom de l'utilisateur.
     */
    #[ORM\Column(length: 100, nullable: true)]
    private ?string $lastName = null;

    /**
     * Poste occupé par l'utilisateur.
     */
    #[ORM\Column(length: 150, nullable: true)]
    private ?string $jobTitle = null;

    /**
     * Département ou service de l'utilisateur.
     */
    #[ORM\Column(length: 150, nullable: true)]
    private ?string $department = null;

    /**
     * Chemin de la photo de profil.
     */
    #[ORM\Column(length: 255, nullable: true)]
    private ?string $photo = null;

    /**
     * Solde de congés de l'utilisateur.
     *
     * Valeur par défaut : 25 jours.
     */
    #[ORM\Column]
    private int $leaveBalance = 25;

    /**
     * Liste des demandes de congé de l'utilisateur.
     */
    #[ORM\OneToMany(targetEntity: Leave::class, mappedBy: 'user')]
    private Collection $leaves;

    /**
     * Liste des entrées de calendrier de l'utilisateur.
     */
    #[ORM\OneToMany(targetEntity: WorkEntry::class, mappedBy: 'user', orphanRemoval: true)]
    private Collection $workEntries;

    /**
     * Liste des documents associés à l'utilisateur.
     */
    #[ORM\OneToMany(targetEntity: Document::class, mappedBy: 'user', orphanRemoval: true)]
    private Collection $documents;

    /**
     * Initialise les collections liées à l'utilisateur.
     */
    public function __construct()
    {
        $this->leaves = new ArrayCollection();
        $this->workEntries = new ArrayCollection();
        $this->documents = new ArrayCollection();
    }

    /**
     * Retourne l'identifiant de l'utilisateur.
     */
    public function getId(): ?int
    {
        return $this->id;
    }

    /**
     * Retourne l'email de l'utilisateur.
     */
    public function getEmail(): ?string
    {
        return $this->email;
    }

    /**
     * Modifie l'email de l'utilisateur.
     */
    public function setEmail(string $email): static
    {
        $this->email = $email;

        return $this;
    }

    /**
     * Retourne l'identifiant utilisé par Symfony Security.
     *
     * Ici, l'identifiant est l'adresse email.
     */
    public function getUserIdentifier(): string
    {
        return (string) $this->email;
    }

    /**
     * Retourne les rôles de l'utilisateur.
     *
     * ROLE_USER est toujours ajouté afin de garantir
     * un rôle minimum à chaque utilisateur.
     */
    public function getRoles(): array
    {
        $roles = $this->roles;
        $roles[] = 'ROLE_USER';

        return array_unique($roles);
    }

    /**
     * Modifie les rôles de l'utilisateur.
     */
    public function setRoles(array $roles): static
    {
        $this->roles = $roles;

        return $this;
    }

    /**
     * Retourne le mot de passe chiffré.
     */
    public function getPassword(): ?string
    {
        return $this->password;
    }

    /**
     * Modifie le mot de passe chiffré.
     */
    public function setPassword(string $password): static
    {
        $this->password = $password;

        return $this;
    }

    /**
     * Indique si l'utilisateur doit changer son mot de passe.
     */
    public function isMustChangePassword(): bool
    {
        return $this->mustChangePassword;
    }

    /**
     * Modifie l'obligation de changement de mot de passe.
     */
    public function setMustChangePassword(bool $mustChangePassword): static
    {
        $this->mustChangePassword = $mustChangePassword;

        return $this;
    }

    /**
     * Retourne le prénom.
     */
    public function getFirstName(): ?string
    {
        return $this->firstName;
    }

    /**
     * Modifie le prénom.
     */
    public function setFirstName(?string $firstName): static
    {
        $this->firstName = $firstName;

        return $this;
    }

    /**
     * Retourne le nom.
     */
    public function getLastName(): ?string
    {
        return $this->lastName;
    }

    /**
     * Modifie le nom.
     */
    public function setLastName(?string $lastName): static
    {
        $this->lastName = $lastName;

        return $this;
    }

    /**
     * Retourne le poste.
     */
    public function getJobTitle(): ?string
    {
        return $this->jobTitle;
    }

    /**
     * Modifie le poste.
     */
    public function setJobTitle(?string $jobTitle): static
    {
        $this->jobTitle = $jobTitle;

        return $this;
    }

    /**
     * Retourne le département.
     */
    public function getDepartment(): ?string
    {
        return $this->department;
    }

    /**
     * Modifie le département.
     */
    public function setDepartment(?string $department): static
    {
        $this->department = $department;

        return $this;
    }

    /**
     * Retourne le chemin de la photo.
     */
    public function getPhoto(): ?string
    {
        return $this->photo;
    }

    /**
     * Modifie la photo de profil.
     */
    public function setPhoto(?string $photo): static
    {
        $this->photo = $photo;

        return $this;
    }

    /**
     * Retourne le solde de congés.
     */
    public function getLeaveBalance(): int
    {
        return $this->leaveBalance;
    }

    /**
     * Modifie le solde de congés.
     */
    public function setLeaveBalance(int $leaveBalance): static
    {
        $this->leaveBalance = $leaveBalance;

        return $this;
    }

    /**
     * Sécurise la sérialisation de l'utilisateur.
     *
     * Le mot de passe n'est pas sérialisé en clair.
     */
    public function __serialize(): array
    {
        $data = (array) $this;
        $data["\0" . self::class . "\0password"] = hash('crc32c', $this->password);

        return $data;
    }

    /**
     * Méthode requise par UserInterface.
     *
     * Elle peut servir à supprimer des données sensibles temporaires.
     */
    #[\Deprecated]
    public function eraseCredentials(): void
    {
    }

    /**
     * Retourne les demandes de congé.
     */
    public function getLeaves(): Collection
    {
        return $this->leaves;
    }

    /**
     * Ajoute une demande de congé à l'utilisateur.
     */
    public function addLeave(Leave $leave): static
    {
        if (!$this->leaves->contains($leave)) {
            $this->leaves->add($leave);
            $leave->setUser($this);
        }

        return $this;
    }

    /**
     * Retire une demande de congé de la collection.
     */
    public function removeLeave(Leave $leave): static
    {
        $this->leaves->removeElement($leave);

        return $this;
    }

    /**
     * Retourne les entrées de calendrier.
     */
    public function getWorkEntries(): Collection
    {
        return $this->workEntries;
    }

    /**
     * Ajoute une entrée de calendrier à l'utilisateur.
     */
    public function addWorkEntry(WorkEntry $workEntry): static
    {
        if (!$this->workEntries->contains($workEntry)) {
            $this->workEntries->add($workEntry);
            $workEntry->setUser($this);
        }

        return $this;
    }

    /**
     * Retire une entrée de calendrier.
     */
    public function removeWorkEntry(WorkEntry $workEntry): static
    {
        if ($this->workEntries->removeElement($workEntry)) {
            if ($workEntry->getUser() === $this) {
                $workEntry->setUser(null);
            }
        }

        return $this;
    }

    /**
     * Retourne les documents de l'utilisateur.
     */
    public function getDocuments(): Collection
    {
        return $this->documents;
    }

    /**
     * Ajoute un document à l'utilisateur.
     */
    public function addDocument(Document $document): static
    {
        if (!$this->documents->contains($document)) {
            $this->documents->add($document);
            $document->setUser($this);
        }

        return $this;
    }

    /**
     * Retire un document de l'utilisateur.
     */
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