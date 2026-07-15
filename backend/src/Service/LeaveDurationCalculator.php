<?php

namespace App\Service;

/**
 * Service metier isole afin de reutiliser et tester le calcul des jours ouvres.
 */
final class LeaveDurationCalculator
{
    /** Compte les jours du lundi au vendredi, bornes incluses. */
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
            // format('N') vaut 1 pour lundi et 7 pour dimanche.
            if ((int) $current->format('N') < 6) {
                $count++;
            }

            $current = $current->modify('+1 day');
        }

        return $count;
    }
}
