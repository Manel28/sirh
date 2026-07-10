<?php

namespace App\Controller;

use App\Entity\User;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Attribute\Route;

class SetupController
{
    #[Route('/api/setup-admin', methods: ['GET', 'POST'])]
    public function createAdmin(
        Request $request,
        UserRepository $userRepository,
        UserPasswordHasherInterface $passwordHasher,
        EntityManagerInterface $entityManager
    ): JsonResponse {
        $expectedSecret = $_ENV['SETUP_SECRET'] ?? getenv('SETUP_SECRET') ?: null;
        $providedSecret = $request->query->get('secret') ?: $request->headers->get('X-Setup-Secret');

        if (!$expectedSecret || !$providedSecret || !hash_equals($expectedSecret, $providedSecret)) {
            return new JsonResponse(['message' => 'Not found'], 404);
        }

        $email = $_ENV['ADMIN_EMAIL'] ?? getenv('ADMIN_EMAIL') ?: null;
        $password = $_ENV['ADMIN_PASSWORD'] ?? getenv('ADMIN_PASSWORD') ?: null;

        if (!$email || !$password) {
            return new JsonResponse([
                'message' => 'Missing ADMIN_EMAIL or ADMIN_PASSWORD environment variable.',
            ], 400);
        }

        $email = strtolower(trim($email));
        $existingAdmin = $userRepository->findOneBy(['email' => $email]);

        if ($existingAdmin) {
            return new JsonResponse([
                'message' => 'Admin already exists.',
                'email' => $existingAdmin->getEmail(),
            ]);
        }

        $admin = new User();
        $admin->setEmail($email);
        $admin->setFirstName('Admin');
        $admin->setLastName('RH');
        $admin->setJobTitle('HR Administrator');
        $admin->setDepartment('Human Resources');
        $admin->setRoles(['ROLE_ADMIN']);
        $admin->setMustChangePassword(false);
        $admin->setPassword($passwordHasher->hashPassword($admin, $password));

        $entityManager->persist($admin);
        $entityManager->flush();

        return new JsonResponse([
            'message' => 'Admin created successfully.',
            'email' => $admin->getEmail(),
        ], 201);
    }
}
