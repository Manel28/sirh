<?php

namespace App\Tests;

use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;

class AdminUserControllerTest extends WebTestCase
{
    public function testCreateCollaboratorSuccessfully(): void
    {
        $client = static::createClient();

        $payload = [
            'firstName' => 'Test',
            'lastName' => 'User',
            'email' => 'test_' . uniqid() . '@example.com',
            'jobTitle' => 'Developer',
            'department' => 'IT',
            'photo' => '',
            'isAdmin' => false,
        ];

        $client->request(
            'POST',
            '/api/admin/users',
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            json_encode($payload)
        );

        $this->assertResponseStatusCodeSame(201);

        $data = json_decode($client->getResponse()->getContent(), true);

        $this->assertArrayHasKey('user', $data);
        $this->assertEquals($payload['email'], $data['user']['email']);
    }

    public function testCannotCreateDuplicateEmail(): void
    {
        $client = static::createClient();

        $email = 'duplicate_' . uniqid() . '@example.com';

        $payload = [
            'firstName' => 'Test',
            'lastName' => 'User',
            'email' => $email,
            'jobTitle' => 'Developer',
            'department' => 'IT',
            'photo' => '',
            'isAdmin' => false,
        ];

        // Première création
        $client->request(
            'POST',
            '/api/admin/users',
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            json_encode($payload)
        );

        $this->assertResponseStatusCodeSame(201);

        // Deuxième création avec le même email
        $client->request(
            'POST',
            '/api/admin/users',
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            json_encode($payload)
        );

        $this->assertResponseStatusCodeSame(409);
    }

    public function testDeleteCollaborator(): void
    {
        $client = static::createClient();

        $payload = [
            'firstName' => 'Delete',
            'lastName' => 'Me',
            'email' => 'delete_' . uniqid() . '@example.com',
            'jobTitle' => 'Developer',
            'department' => 'IT',
            'photo' => '',
            'isAdmin' => false,
        ];

        $client->request(
            'POST',
            '/api/admin/users',
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            json_encode($payload)
        );

        $this->assertResponseStatusCodeSame(201);

        $data = json_decode($client->getResponse()->getContent(), true);

        $this->assertArrayHasKey('user', $data);
        $this->assertArrayHasKey('id', $data['user']);

        $userId = $data['user']['id'];

        $client->request(
            'DELETE',
            '/api/admin/users/' . $userId
        );

        $this->assertResponseIsSuccessful();
    }
}