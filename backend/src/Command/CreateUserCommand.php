<?php

namespace App\Command;

use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

/**
 * Commande Symfony permettant de créer un utilisateur
 * directement depuis le terminal.
 *
 * Cette commande demande :
 * - une adresse email ;
 * - un mot de passe ;
 * - un rôle utilisateur.
 *
 * Le mot de passe est automatiquement chiffré avant
 * l'enregistrement dans la base de données.
 */
#[AsCommand(
    name: 'app:create-user',
    description: 'Create a new user',
)]
class CreateUserCommand extends Command
{
    /**
     * Injection des services nécessaires :
     * - EntityManager pour accéder à la base de données ;
     * - PasswordHasher pour chiffrer le mot de passe.
     */
    public function __construct(
        private EntityManagerInterface $entityManager,
        private UserPasswordHasherInterface $passwordHasher
    ) {
        parent::__construct();
    }

    /**
     * Méthode exécutée lors du lancement de la commande.
     */
    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        // Permet d'afficher des messages formatés dans le terminal
        $io = new SymfonyStyle($input, $output);

        /**
         * Demande de l'adresse email de l'utilisateur.
         */
        $email = $io->ask('Enter email');

        /**
         * Demande du mot de passe.
         * Le mot de passe reste masqué dans le terminal.
         */
        $password = $io->askHidden('Enter password');

        /**
         * Sélection du rôle utilisateur.
         *
         * Deux rôles disponibles :
         * - ROLE_USER : collaborateur
         * - ROLE_ADMIN : administrateur RH
         */
        $role = $io->choice(
            'Select role',
            ['ROLE_USER', 'ROLE_ADMIN'],
            'ROLE_USER'
        );

        /**
         * Vérification qu'aucun utilisateur
         * avec cet email n'existe déjà.
         */
        $existingUser = $this->entityManager
            ->getRepository(User::class)
            ->findOneBy([
                'email' => $email
            ]);

        if ($existingUser) {
            $io->error('User already exists!');

            return Command::FAILURE;
        }

        /**
         * Création d'une nouvelle entité User.
         */
        $user = new User();

        $user->setEmail($email);

        // Attribution du rôle sélectionné
        $user->setRoles([$role]);

        /**
         * Chiffrement sécurisé du mot de passe.
         */
        $hashedPassword = $this->passwordHasher
            ->hashPassword($user, $password);

        $user->setPassword($hashedPassword);

        /**
         * Enregistrement en base de données.
         */
        $this->entityManager->persist($user);
        $this->entityManager->flush();

        /**
         * Message de confirmation.
         */
        $io->success('User created successfully!');

        return Command::SUCCESS;
    }
}