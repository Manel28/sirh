<?php

namespace App\Controller;

use App\Entity\User;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Email;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Attribute\Route;

class AdminUserController
{
    #[Route('/api/admin/users', name: 'api_admin_users_list', methods: ['GET'])]
    public function listUsers(UserRepository $userRepository): JsonResponse
    {
        $users = $userRepository->findBy([], ['id' => 'DESC']);

        $data = array_map(function (User $user) {
            return [
                'id' => $user->getId(),
                'firstName' => $user->getFirstName(),
                'lastName' => $user->getLastName(),
                'email' => $user->getEmail(),
                'jobTitle' => $user->getJobTitle(),
                'department' => $user->getDepartment(),
                'photo' => $user->getPhoto(),
                'roles' => $user->getRoles(),
                'mustChangePassword' => $user->isMustChangePassword(),
            ];
        }, $users);

        return new JsonResponse($data);
    }

    #[Route('/api/admin/users', name: 'api_admin_users_create', methods: ['POST'])]
    public function createUser(
        Request $request,
        UserRepository $userRepository,
        EntityManagerInterface $entityManager,
        UserPasswordHasherInterface $passwordHasher,
        MailerInterface $mailer
    ): JsonResponse {
        try {
            $data = json_decode($request->getContent(), true);

            if (
                !$data ||
                empty($data['firstName']) ||
                empty($data['lastName']) ||
                empty($data['email']) ||
                empty($data['jobTitle']) ||
                empty($data['department'])
            ) {
                return new JsonResponse(['message' => 'Missing required fields'], 400);
            }

            $email = strtolower(trim($data['email']));

            if ($userRepository->findOneBy(['email' => $email])) {
                return new JsonResponse(['message' => 'A user with this email already exists'], 409);
            }

            $temporaryPassword = $this->generateStrongPassword();

            $user = new User();
            $user->setFirstName(trim($data['firstName']));
            $user->setLastName(trim($data['lastName']));
            $user->setEmail($email);
            $user->setJobTitle(trim($data['jobTitle']));
            $user->setDepartment(trim($data['department']));
            $user->setPhoto($data['photo'] ?? null);
            $user->setRoles(!empty($data['isAdmin']) ? ['ROLE_ADMIN'] : ['ROLE_USER']);
            $user->setPassword($passwordHasher->hashPassword($user, $temporaryPassword));
            $user->setMustChangePassword(true);

            $entityManager->persist($user);
            $entityManager->flush();

            $emailMessage = (new Email())
                ->from('adminsirh@gmail.com')
                ->to($user->getEmail())
                ->subject('Your collaborator account has been created')
                ->html("
                    <h2>Hello {$user->getFirstName()},</h2>
                    <p>Your collaborator account has been created successfully.</p>
                    <p><strong>Email:</strong> {$user->getEmail()}</p>
                    <p><strong>Temporary password:</strong> {$temporaryPassword}</p>
                    <p>You must change your password after your first login.</p>
                    <br>
                    <p>HR Team</p>
                ");

            $mailer->send($emailMessage);

            return new JsonResponse([
                'message' => 'Collaborator created successfully. An email has been sent.',
            ], 201);

        } catch (\Throwable $e) {
            return new JsonResponse([
                'message' => 'Server error',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    #[Route('/api/admin/users/{id}', name: 'api_admin_users_update', methods: ['PUT'])]
    public function updateUser(
        int $id,
        Request $request,
        UserRepository $userRepository,
        EntityManagerInterface $entityManager
    ): JsonResponse {
        try {
            $user = $userRepository->find($id);

            if (!$user) {
                return new JsonResponse(['message' => 'Collaborator not found'], 404);
            }

            $data = json_decode($request->getContent(), true);

            if (!$data) {
                return new JsonResponse(['message' => 'Invalid data'], 400);
            }

            if (
                empty($data['firstName']) ||
                empty($data['lastName']) ||
                empty($data['email']) ||
                empty($data['jobTitle']) ||
                empty($data['department'])
            ) {
                return new JsonResponse(['message' => 'Missing required fields'], 400);
            }

            $email = strtolower(trim($data['email']));
            $existingUser = $userRepository->findOneBy(['email' => $email]);

            if ($existingUser && $existingUser->getId() !== $user->getId()) {
                return new JsonResponse(['message' => 'A user with this email already exists'], 409);
            }

            $user->setFirstName(trim($data['firstName']));
            $user->setLastName(trim($data['lastName']));
            $user->setEmail($email);
            $user->setJobTitle(trim($data['jobTitle']));
            $user->setDepartment(trim($data['department']));
            $user->setPhoto($data['photo'] ?? null);
            $user->setRoles(!empty($data['isAdmin']) ? ['ROLE_ADMIN'] : ['ROLE_USER']);

            $entityManager->flush();

            return new JsonResponse([
                'message' => 'Collaborator updated successfully.',
            ]);

        } catch (\Throwable $e) {
            return new JsonResponse([
                'message' => 'Server error while updating collaborator',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    #[Route('/api/admin/users/{id}', name: 'api_admin_users_delete', methods: ['DELETE'])]
    public function deleteUser(
        int $id,
        UserRepository $userRepository,
        EntityManagerInterface $entityManager
    ): JsonResponse {
        $user = $userRepository->find($id);

        if (!$user) {
            return new JsonResponse(['message' => 'Collaborator not found'], 404);
        }

        if (in_array('ROLE_ADMIN', $user->getRoles(), true)) {
            return new JsonResponse(['message' => 'Cannot delete admin / HR account'], 403);
        }

        foreach ($user->getDocuments() as $document) {
            $entityManager->remove($document);
        }

        foreach ($user->getLeaves() as $leave) {
            $entityManager->remove($leave);
        }

        foreach ($user->getWorkEntries() as $workEntry) {
            $entityManager->remove($workEntry);
        }

        $entityManager->remove($user);
        $entityManager->flush();

        return new JsonResponse([
            'message' => 'Collaborator deleted successfully',
        ]);
    }

    private function generateStrongPassword(int $length = 12): string
    {
        $lowercase = 'abcdefghijklmnopqrstuvwxyz';
        $uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        $numbers = '0123456789';
        $symbols = '!@#$%&*?';

        $password = [
            $lowercase[random_int(0, strlen($lowercase) - 1)],
            $uppercase[random_int(0, strlen($uppercase) - 1)],
            $numbers[random_int(0, strlen($numbers) - 1)],
            $symbols[random_int(0, strlen($symbols) - 1)],
        ];

        $all = $lowercase . $uppercase . $numbers . $symbols;

        for ($i = count($password); $i < $length; $i++) {
            $password[] = $all[random_int(0, strlen($all) - 1)];
        }

        shuffle($password);

        return implode('', $password);
    }
}