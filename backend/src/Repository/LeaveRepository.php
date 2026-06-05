<?php

namespace App\Repository;

use App\Entity\Leave;
use App\Entity\User;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

class LeaveRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Leave::class);
    }

    public function hasOverlappingLeave(
        User $user,
        \DateTimeInterface $startDate,
        \DateTimeInterface $endDate
    ): bool {
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