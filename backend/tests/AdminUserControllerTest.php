<?php

namespace App\Tests;

use App\Entity\User;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Lexik\Bundle\JWTAuthenticationBundle\Services\JWTTokenManagerInterface;
use Symfony\Bundle\FrameworkBundle\KernelBrowser;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

/**
 * Tests fonctionnels : WebTestCase demarre Symfony, appelle l'API HTTP et utilise
 * la base de test afin de verifier le comportement complet du controleur.
 */
class AdminUserControllerTest extends WebTestCase
{
    public function testCreateCollaboratorSuccessfully(): void
    {
        // Arrange : client HTTP authentifie et donnees uniques.
        $client = static::createClient();
        $this->authenticateAdmin($client);

        $payload = $this->collaboratorPayload('test_');
        // Act : simulation du POST effectue normalement par Axios.
        $this->requestJson($client, 'POST', '/api/admin/users', $payload);

        // Assert : verification du code HTTP, du JSON puis de la base de donnees.
        $this->assertResponseStatusCodeSame(201);

        $data = json_decode($client->getResponse()->getContent(), true);
        $this->assertSame(
            'Collaborator created successfully. An email has been sent.',
            $data['message'] ?? null
        );

        $user = static::getContainer()
            ->get(UserRepository::class)
            ->findOneBy(['email' => $payload['email']]);

        $this->assertNotNull($user);
        $this->assertSame($payload['email'], $user->getEmail());
    }

    public function testCannotCreateDuplicateEmail(): void
    {
        $client = static::createClient();
        $this->authenticateAdmin($client);
        $payload = $this->collaboratorPayload('duplicate_');

        $this->requestJson($client, 'POST', '/api/admin/users', $payload);
        $this->assertResponseStatusCodeSame(201);

        $this->requestJson($client, 'POST', '/api/admin/users', $payload);
        $this->assertResponseStatusCodeSame(409);
    }

    public function testDeleteCollaborator(): void
    {
        $client = static::createClient();
        $this->authenticateAdmin($client);
        $payload = $this->collaboratorPayload('delete_');

        $this->requestJson($client, 'POST', '/api/admin/users', $payload);
        $this->assertResponseStatusCodeSame(201);

        $user = static::getContainer()
            ->get(UserRepository::class)
            ->findOneBy(['email' => $payload['email']]);

        $this->assertNotNull($user);
        $userId = $user->getId();

        $client->request('DELETE', '/api/admin/users/' . $userId);
        $this->assertResponseIsSuccessful();

        static::getContainer()->get(EntityManagerInterface::class)->clear();
        $deletedUser = static::getContainer()->get(UserRepository::class)->find($userId);
        $this->assertNull($deletedUser);
    }

    private function authenticateAdmin(KernelBrowser $client): User
    {
        // Cree un administrateur dans la base de test puis genere son JWT.
        $container = static::getContainer();
        $entityManager = $container->get(EntityManagerInterface::class);
        $passwordHasher = $container->get(UserPasswordHasherInterface::class);

        $admin = (new User())
            ->setEmail('admin_' . uniqid() . '@example.com')
            ->setFirstName('Admin')
            ->setLastName('Test')
            ->setRoles(['ROLE_ADMIN']);
        $admin->setPassword($passwordHasher->hashPassword($admin, 'Admin123!'));

        $entityManager->persist($admin);
        $entityManager->flush();

        $token = $container->get(JWTTokenManagerInterface::class)->create($admin);
        // Le client de test enverra ce Bearer token sur les prochaines requetes.
        $client->setServerParameter('HTTP_AUTHORIZATION', 'Bearer ' . $token);

        return $admin;
    }

    private function collaboratorPayload(string $prefix): array
    {
        return [
            'firstName' => 'Test',
            'lastName' => 'User',
            'email' => $prefix . uniqid() . '@example.com',
            'jobTitle' => 'Developer',
            'department' => 'IT',
            'photo' => '',
            'isAdmin' => false,
        ];
    }

    private function requestJson(
        KernelBrowser $client,
        string $method,
        string $uri,
        array $payload
    ): void {
        // Helper commun qui reproduit une requete Axios avec un body JSON.
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
