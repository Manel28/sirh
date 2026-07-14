<?php

namespace App\Tests;

use App\Entity\Notification;
use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Lexik\Bundle\JWTAuthenticationBundle\Services\JWTTokenManagerInterface;
use Symfony\Bundle\FrameworkBundle\KernelBrowser;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

class SecurityControllerTest extends WebTestCase
{
    public function testPrivateRouteRequiresToken(): void
    {
        $client = static::createClient();
        $client->request('GET', '/api/profile');

        $this->assertResponseStatusCodeSame(401);
    }

    public function testCollaboratorCannotAccessAdminRoute(): void
    {
        $client = static::createClient();
        $user = $this->createUser('user_', ['ROLE_USER']);
        $this->authenticate($client, $user);

        $client->request('GET', '/api/admin/users');

        $this->assertResponseStatusCodeSame(403);
    }

    public function testLoginReturnsSignedToken(): void
    {
        $client = static::createClient();
        $user = $this->createUser('login_', ['ROLE_USER'], 'Strong123!');

        $this->requestJson($client, 'POST', '/api/login', [
            'email' => $user->getEmail(),
            'password' => 'Strong123!',
        ]);

        $this->assertResponseIsSuccessful();
        $data = json_decode($client->getResponse()->getContent(), true);
        $this->assertIsString($data['token'] ?? null);
        $this->assertNotSame('', $data['token'] ?? '');
        $this->assertArrayNotHasKey('password', $data['user'] ?? []);
    }

    public function testLeaveIgnoresSpoofedUserId(): void
    {
        $client = static::createClient();
        $authenticatedUser = $this->createUser('leave_owner_', ['ROLE_USER']);
        $otherUser = $this->createUser('leave_other_', ['ROLE_USER']);
        $this->authenticate($client, $authenticatedUser);

        $start = new \DateTime('next monday');
        $this->requestJson($client, 'POST', '/api/leaves', [
            'type' => 'Paid Leave',
            'start' => $start->format('Y-m-d'),
            'end' => $start->format('Y-m-d'),
            'userId' => $otherUser->getId(),
        ]);

        $this->assertResponseStatusCodeSame(201);
        $data = json_decode($client->getResponse()->getContent(), true);
        $this->assertSame($authenticatedUser->getId(), $data['leave']['user']['id'] ?? null);
    }

    public function testUserCannotReadAnotherUsersNotification(): void
    {
        $client = static::createClient();
        $authenticatedUser = $this->createUser('notification_reader_', ['ROLE_USER']);
        $otherUser = $this->createUser('notification_owner_', ['ROLE_USER']);

        $notification = (new Notification())
            ->setUser($otherUser)
            ->setTitle('Private')
            ->setMessage('Private notification')
            ->setType('test')
            ->setIsRead(false)
            ->setCreatedAt(new \DateTime());

        $entityManager = static::getContainer()->get(EntityManagerInterface::class);
        $entityManager->persist($notification);
        $entityManager->flush();

        $this->authenticate($client, $authenticatedUser);
        $client->request('PATCH', '/api/notifications/' . $notification->getId() . '/read');

        $this->assertResponseStatusCodeSame(404);
    }

    private function createUser(
        string $prefix,
        array $roles,
        string $plainPassword = 'Password123!'
    ): User {
        $container = static::getContainer();
        $entityManager = $container->get(EntityManagerInterface::class);
        $passwordHasher = $container->get(UserPasswordHasherInterface::class);

        $user = (new User())
            ->setEmail($prefix . uniqid() . '@example.com')
            ->setFirstName('Security')
            ->setLastName('Test')
            ->setRoles($roles);
        $user->setPassword($passwordHasher->hashPassword($user, $plainPassword));

        $entityManager->persist($user);
        $entityManager->flush();

        return $user;
    }

    private function authenticate(KernelBrowser $client, User $user): void
    {
        $token = static::getContainer()
            ->get(JWTTokenManagerInterface::class)
            ->create($user);
        $client->setServerParameter('HTTP_AUTHORIZATION', 'Bearer ' . $token);
    }

    private function requestJson(
        KernelBrowser $client,
        string $method,
        string $uri,
        array $payload
    ): void {
        $client->request(
            $method,
            $uri,
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            json_encode($payload, JSON_THROW_ON_ERROR)
        );
    }
}
