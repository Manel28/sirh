<?php

namespace App\Tests\Unit;

use App\Service\PasswordPolicy;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

final class PasswordPolicyTest extends TestCase
{
    public function testAcceptsStrongPassword(): void
    {
        $policy = new PasswordPolicy();

        self::assertTrue($policy->isValid('Valid123!'));
    }

    #[DataProvider('invalidPasswords')]
    public function testRejectsPasswordWhenOneRuleIsMissing(string $password): void
    {
        $policy = new PasswordPolicy();

        self::assertFalse($policy->isValid($password));
    }

    public static function invalidPasswords(): iterable
    {
        yield 'too short' => ['Val1!'];
        yield 'no uppercase letter' => ['valid123!'];
        yield 'no lowercase letter' => ['VALID123!'];
        yield 'no number' => ['ValidPass!'];
        yield 'no special character' => ['Valid1234'];
        yield 'empty password' => [''];
    }
}
