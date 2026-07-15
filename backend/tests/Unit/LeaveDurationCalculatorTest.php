<?php

namespace App\Tests\Unit;

use App\Service\LeaveDurationCalculator;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

final class LeaveDurationCalculatorTest extends TestCase
{
    // Le DataProvider rejoue le meme test avec plusieurs periodes.
    #[DataProvider('workingDayPeriods')]
    public function testCountsOnlyWorkingDays(
        string $start,
        string $end,
        int $expectedDays
    ): void {
        // Arrange : preparation du service et des donnees de test.
        $calculator = new LeaveDurationCalculator();

        // Act : execution de la methode metier testee.
        $actualDays = $calculator->countWorkingDays(
            new \DateTimeImmutable($start),
            new \DateTimeImmutable($end)
        );

        // Assert : comparaison stricte entre le resultat attendu et le resultat obtenu.
        self::assertSame($expectedDays, $actualDays);
    }

    public static function workingDayPeriods(): iterable
    {
        yield 'one weekday' => ['2026-07-15', '2026-07-15', 1];
        yield 'weekend only' => ['2026-07-18', '2026-07-19', 0];
        yield 'Friday through Monday' => ['2026-07-17', '2026-07-20', 2];
        yield 'complete week' => ['2026-07-13', '2026-07-19', 5];
        yield 'end before start' => ['2026-07-20', '2026-07-17', 0];
    }

    public function testDoesNotModifyMutableInputDates(): void
    {
        // Arrange
        $calculator = new LeaveDurationCalculator();
        $start = new \DateTime('2026-07-17');
        $end = new \DateTime('2026-07-20');

        // Act
        $calculator->countWorkingDays($start, $end);

        // Assert : le service doit travailler sur des copies des dates recues.
        self::assertSame('2026-07-17', $start->format('Y-m-d'));
        self::assertSame('2026-07-20', $end->format('Y-m-d'));
    }
}
