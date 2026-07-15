<?php

namespace App\Service;

final class LeaveDurationCalculator
{
    public function countWorkingDays(
        \DateTimeInterface $startDate,
        \DateTimeInterface $endDate
    ): int {
        if ($endDate < $startDate) {
            return 0;
        }

        $count = 0;
        $current = \DateTimeImmutable::createFromInterface($startDate);
        $end = \DateTimeImmutable::createFromInterface($endDate);

        while ($current <= $end) {
            if ((int) $current->format('N') < 6) {
                $count++;
            }

            $current = $current->modify('+1 day');
        }

        return $count;
    }
}
