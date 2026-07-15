<?php

namespace App\Repository;

use App\Entity\Leave;
use App\Entity\User;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * Repository Doctrine specialise dans les recherches sur les demandes de conge.
 */
class LeaveRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Leave::class);
    }

    /** Verifie si une demande Pending ou Approved chevauche la periode choisie. */
    public function hasOverlappingLeave(
        User $user,
        \DateTimeInterface $startDate,
        \DateTimeInterface $endDate
    ): bool {
        // Les valeurs sont liees avec setParameter : elles ne sont pas concatenees au SQL.
        $count = $this->createQueryBuilder('l')
            ->select('COUNT(l.id)')
            ->where('l.user = :user')
            ->andWhere('l.status IN (:statuses)')
            ->andWhere('l.startDate <= :endDate')
            ->andWhere('l.endDate >= :startDate')
            ->setParameter('user', $user)
            ->setParameter('statuses', ['Pending', 'Approved'])
            ->setParameter('startDate', $startDate)
            ->setParameter('endDate', $endDate)
            ->getQuery()
            ->getSingleScalarResult();

        return $count > 0;
    }
}
