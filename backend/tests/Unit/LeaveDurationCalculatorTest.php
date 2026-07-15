<?php

namespace App\Tests\Unit;

use App\Service\LeaveDurationCalculator;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

final class LeaveDurationCalculatorTest extends TestCase
{
    #[DataProvider('workingDayPeriods')]
    public function testCountsOnlyWorkingDays(
        string $start,
        string $end,
        int $expectedDays
    ): void {
        $calculator = new LeaveDurationCalculator();

        $actualDays = $calculator->countWorkingDays(
            new \DateTimeImmutable($start),
            new \DateTimeImmutable($end)
        );

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
        $calculator = new LeaveDurationCalculator();
        $start = new \DateTime('2026-07-17');
        $end = new \DateTime('2026-07-20');

        $calculator->countWorkingDays($start, $end);

        self::assertSame('2026-07-17', $start->format('Y-m-d'));
        self::assertSame('2026-07-20', $end->format('Y-m-d'));
    }
}
