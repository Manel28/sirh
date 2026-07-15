<?php

namespace App\Tests\Unit;

use App\Service\PasswordPolicy;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

final class PasswordPolicyTest extends TestCase
{
    public function testAcceptsStrongPassword(): void
    {
        // Arrange
        $policy = new PasswordPolicy();

        // Act + Assert : le mot de passe respecte toutes les regles.
        self::assertTrue($policy->isValid('Valid123!'));
    }

    #[DataProvider('invalidPasswords')]
    public function testRejectsPasswordWhenOneRuleIsMissing(string $password): void
    {
        // Arrange
        $policy = new PasswordPolicy();

        // Act + Assert : chaque valeur fournie doit etre refusee.
        self::assertFalse($policy->isValid($password));
    }

    public static function invalidPasswords(): iterable
    {
        // Chaque cas retire volontairement une regle de la politique de securite.
        yield 'too short' => ['Val1!'];
        yield 'no uppercase letter' => ['valid123!'];
        yield 'no lowercase letter' => ['VALID123!'];
        yield 'no number' => ['ValidPass!'];
        yield 'no special character' => ['Valid1234'];
        yield 'empty password' => [''];
    }
}
