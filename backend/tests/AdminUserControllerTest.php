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
            'email' => 'testuser@example.com',
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
    }

    public function testCannotCreateDuplicateEmail(): void
    {
        $client = static::createClient();

        $payload = [
            'firstName' => 'Test',
            'lastName' => 'User',
            'email' => 'duplicate@example.com',
            'jobTitle' => 'Dev',
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
            'email' => 'delete@example.com',
            'jobTitle' => 'Dev',
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

        $data = json_decode($client->getResponse()->getContent(), true);
        $userId = $data['user']['id'];

        $client->request('DELETE', '/api/admin/users/' . $userId);

        $this->assertResponseIsSuccessful();
    }
}