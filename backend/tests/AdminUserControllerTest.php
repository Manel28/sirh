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

        $this->assertArrayHasKey('message', $data);
        $this->assertStringContainsString(
            'Collaborator created successfully',
            $data['message']
        );
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

        $client->request(
            'POST',
            '/api/admin/users',
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            json_encode($payload)
        );

        $this->assertResponseStatusCodeSame(201);

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
}