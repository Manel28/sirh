<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260412143022 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE leaves DROP FOREIGN KEY `FK_9BB080D0A76ED395`');
        $this->addSql('DROP INDEX idx_9bb080d0a76ed395 ON leaves');
        $this->addSql('CREATE INDEX IDX_9D46AD5FA76ED395 ON leaves (user_id)');
        $this->addSql('ALTER TABLE leaves ADD CONSTRAINT `FK_9BB080D0A76ED395` FOREIGN KEY (user_id) REFERENCES user (id)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE leaves DROP FOREIGN KEY FK_9D46AD5FA76ED395');
        $this->addSql('DROP INDEX idx_9d46ad5fa76ed395 ON leaves');
        $this->addSql('CREATE INDEX IDX_9BB080D0A76ED395 ON leaves (user_id)');
        $this->addSql('ALTER TABLE leaves ADD CONSTRAINT FK_9D46AD5FA76ED395 FOREIGN KEY (user_id) REFERENCES user (id)');
    }
}
