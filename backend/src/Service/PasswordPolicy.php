<?php

namespace App\Service;

/**
 * Regroupe la regle de complexite du mot de passe pour la tester independamment.
 */
final class PasswordPolicy
{
    // Exige 8 caracteres, une majuscule, une minuscule, un chiffre et un symbole.
    public function isValid(string $password): bool
    {
        return strlen($password) >= 8
            && preg_match('/[A-Z]/', $password) === 1
            && preg_match('/[a-z]/', $password) === 1
            && preg_match('/[0-9]/', $password) === 1
            && preg_match('/[\W_]/', $password) === 1;
    }
}
