<?php

namespace App\Service;

final class PasswordPolicy
{
    public function isValid(string $password): bool
    {
        return strlen($password) >= 8
            && preg_match('/[A-Z]/', $password) === 1
            && preg_match('/[a-z]/', $password) === 1
            && preg_match('/[0-9]/', $password) === 1
            && preg_match('/[\W_]/', $password) === 1;
    }
}
