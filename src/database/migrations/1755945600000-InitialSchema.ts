import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Baseline schema aligned with current TypeORM entities (P0).
 * Idempotent: safe on existing DBs created via synchronize, and on fresh installs.
 *
 * Includes:
 * - full table set (CREATE IF NOT EXISTS)
 * - user.mustChangePassword
 * - member_role.role as VARCHAR(50) (replaces incomplete MySQL ENUM)
 */
export class InitialSchema1755945600000 implements MigrationInterface {
  name = 'InitialSchema1755945600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('SET FOREIGN_KEY_CHECKS = 0');

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`user\` (
        \`username\` varchar(255) NOT NULL,
        \`password\` varchar(255) NOT NULL,
        \`roles\` text NOT NULL,
        \`mustChangePassword\` tinyint NOT NULL DEFAULT 0,
        PRIMARY KEY (\`username\`)
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`member\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`firstname\` varchar(255) NOT NULL,
        \`lastname\` varchar(255) NOT NULL,
        \`email\` varchar(255) NULL,
        \`avatar\` varchar(255) NULL,
        \`phone\` varchar(255) NOT NULL,
        \`country\` varchar(255) NOT NULL,
        \`isActive\` tinyint NOT NULL DEFAULT 1,
        \`userUsername\` varchar(255) NULL,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`REL_member_user\` (\`userUsername\`),
        CONSTRAINT \`FK_member_user\` FOREIGN KEY (\`userUsername\`) REFERENCES \`user\` (\`username\`) ON DELETE SET NULL ON UPDATE CASCADE
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`config_tontine\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`defaultLoanRate\` int NOT NULL DEFAULT 1,
        \`defaultLoanDuration\` int NULL DEFAULT 30,
        \`loopPeriod\` varchar(255) NOT NULL DEFAULT 'MONTHLY',
        \`minLoanAmount\` int NOT NULL DEFAULT 100,
        \`countPersonPerMovement\` int NOT NULL DEFAULT 1,
        \`movementType\` varchar(255) NOT NULL DEFAULT 'ROTATIVE',
        \`countMaxMember\` int NOT NULL DEFAULT 12,
        \`systemType\` enum('PART','AUCTION') NOT NULL DEFAULT 'AUCTION',
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`rate_map\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`rate\` int NOT NULL,
        \`maxAmount\` int NOT NULL,
        \`minAmount\` int NOT NULL,
        \`configTontineId\` int NULL,
        PRIMARY KEY (\`id\`),
        KEY \`FK_rate_map_config\` (\`configTontineId\`),
        CONSTRAINT \`FK_rate_map_config\` FOREIGN KEY (\`configTontineId\`) REFERENCES \`config_tontine\` (\`id\`) ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`part_order\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`order\` int NOT NULL,
        \`period\` datetime NOT NULL,
        \`memberId\` int NOT NULL,
        \`configId\` int NULL,
        PRIMARY KEY (\`id\`),
        KEY \`FK_part_order_member\` (\`memberId\`),
        KEY \`FK_part_order_config\` (\`configId\`),
        CONSTRAINT \`FK_part_order_member\` FOREIGN KEY (\`memberId\`) REFERENCES \`member\` (\`id\`) ON DELETE NO ACTION ON UPDATE CASCADE,
        CONSTRAINT \`FK_part_order_config\` FOREIGN KEY (\`configId\`) REFERENCES \`config_tontine\` (\`id\`) ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`cash_flow\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`amount\` double NOT NULL,
        \`currency\` varchar(255) NOT NULL DEFAULT 'EUR',
        \`dividendes\` double NOT NULL,
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`tontine\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`title\` varchar(255) NOT NULL,
        \`legacy\` varchar(255) NULL,
        \`isSelected\` tinyint NOT NULL DEFAULT 0,
        \`isActive\` tinyint NOT NULL DEFAULT 1,
        \`configId\` int NULL,
        \`cashFlowId\` int NULL,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`REL_tontine_config\` (\`configId\`),
        UNIQUE KEY \`REL_tontine_cashflow\` (\`cashFlowId\`),
        CONSTRAINT \`FK_tontine_config\` FOREIGN KEY (\`configId\`) REFERENCES \`config_tontine\` (\`id\`) ON DELETE SET NULL ON UPDATE CASCADE,
        CONSTRAINT \`FK_tontine_cashflow\` FOREIGN KEY (\`cashFlowId\`) REFERENCES \`cash_flow\` (\`id\`) ON DELETE SET NULL ON UPDATE CASCADE
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`tontine_members_member\` (
        \`tontineId\` int NOT NULL,
        \`memberId\` int NOT NULL,
        PRIMARY KEY (\`tontineId\`, \`memberId\`),
        KEY \`FK_tontine_members_member\` (\`memberId\`),
        CONSTRAINT \`FK_tontine_members_tontine\` FOREIGN KEY (\`tontineId\`) REFERENCES \`tontine\` (\`id\`) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT \`FK_tontine_members_member\` FOREIGN KEY (\`memberId\`) REFERENCES \`member\` (\`id\`) ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`member_role\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`role\` varchar(50) NOT NULL DEFAULT 'TONTINARD',
        \`userUsername\` varchar(255) NULL,
        \`tontineId\` int NULL,
        PRIMARY KEY (\`id\`),
        KEY \`FK_member_role_user\` (\`userUsername\`),
        KEY \`FK_member_role_tontine\` (\`tontineId\`),
        CONSTRAINT \`FK_member_role_user\` FOREIGN KEY (\`userUsername\`) REFERENCES \`user\` (\`username\`) ON DELETE SET NULL ON UPDATE CASCADE,
        CONSTRAINT \`FK_member_role_tontine\` FOREIGN KEY (\`tontineId\`) REFERENCES \`tontine\` (\`id\`) ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`deposit\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`amount\` double NOT NULL,
        \`currency\` varchar(255) NOT NULL DEFAULT 'FCFA',
        \`status\` varchar(255) NOT NULL,
        \`creationDate\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`reasons\` varchar(255) NULL,
        \`authorId\` int NULL,
        \`cashFlowId\` int NULL,
        PRIMARY KEY (\`id\`),
        KEY \`FK_deposit_author\` (\`authorId\`),
        KEY \`FK_deposit_cashflow\` (\`cashFlowId\`),
        CONSTRAINT \`FK_deposit_author\` FOREIGN KEY (\`authorId\`) REFERENCES \`member\` (\`id\`) ON DELETE SET NULL ON UPDATE CASCADE,
        CONSTRAINT \`FK_deposit_cashflow\` FOREIGN KEY (\`cashFlowId\`) REFERENCES \`cash_flow\` (\`id\`) ON DELETE SET NULL ON UPDATE CASCADE
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`loan\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`amount\` double NOT NULL,
        \`createdAt\` datetime NOT NULL,
        \`status\` varchar(255) NOT NULL,
        \`currency\` varchar(255) NOT NULL DEFAULT 'EUR',
        \`redemptionDate\` datetime NULL,
        \`interestRate\` double NULL,
        \`voters\` text NULL,
        \`tontineId\` int NULL,
        \`authorId\` int NULL,
        PRIMARY KEY (\`id\`),
        KEY \`FK_loan_tontine\` (\`tontineId\`),
        KEY \`FK_loan_author\` (\`authorId\`),
        CONSTRAINT \`FK_loan_tontine\` FOREIGN KEY (\`tontineId\`) REFERENCES \`tontine\` (\`id\`) ON DELETE SET NULL ON UPDATE CASCADE,
        CONSTRAINT \`FK_loan_author\` FOREIGN KEY (\`authorId\`) REFERENCES \`member\` (\`id\`) ON DELETE SET NULL ON UPDATE CASCADE
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`event\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`title\` varchar(255) NOT NULL,
        \`type\` varchar(255) NOT NULL,
        \`description\` varchar(255) NOT NULL,
        \`startDate\` datetime NOT NULL,
        \`endDate\` datetime NULL,
        \`authorId\` int NULL,
        \`tontineId\` int NULL,
        PRIMARY KEY (\`id\`),
        KEY \`FK_event_author\` (\`authorId\`),
        KEY \`FK_event_tontine\` (\`tontineId\`),
        CONSTRAINT \`FK_event_author\` FOREIGN KEY (\`authorId\`) REFERENCES \`member\` (\`id\`) ON DELETE SET NULL ON UPDATE CASCADE,
        CONSTRAINT \`FK_event_tontine\` FOREIGN KEY (\`tontineId\`) REFERENCES \`tontine\` (\`id\`) ON DELETE SET NULL ON UPDATE CASCADE
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`event_participants_member\` (
        \`eventId\` int NOT NULL,
        \`memberId\` int NOT NULL,
        PRIMARY KEY (\`eventId\`, \`memberId\`),
        KEY \`FK_event_participants_member\` (\`memberId\`),
        CONSTRAINT \`FK_event_participants_event\` FOREIGN KEY (\`eventId\`) REFERENCES \`event\` (\`id\`) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT \`FK_event_participants_member\` FOREIGN KEY (\`memberId\`) REFERENCES \`member\` (\`id\`) ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`rapport_meeting\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`title\` varchar(255) NOT NULL,
        \`content\` varchar(255) NOT NULL,
        \`createdAt\` datetime NOT NULL,
        \`updatedAt\` datetime NULL,
        \`attachmentFilename\` varchar(255) NULL,
        \`authorId\` int NULL,
        \`tontineId\` int NULL,
        PRIMARY KEY (\`id\`),
        KEY \`FK_rapport_author\` (\`authorId\`),
        KEY \`FK_rapport_tontine\` (\`tontineId\`),
        CONSTRAINT \`FK_rapport_author\` FOREIGN KEY (\`authorId\`) REFERENCES \`member\` (\`id\`) ON DELETE SET NULL ON UPDATE CASCADE,
        CONSTRAINT \`FK_rapport_tontine\` FOREIGN KEY (\`tontineId\`) REFERENCES \`tontine\` (\`id\`) ON DELETE SET NULL ON UPDATE CASCADE
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`sanction\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`type\` varchar(255) NOT NULL,
        \`description\` varchar(255) NOT NULL,
        \`startDate\` datetime NULL,
        \`endDate\` datetime NULL,
        \`tontineId\` int NULL,
        PRIMARY KEY (\`id\`),
        KEY \`FK_sanction_tontine\` (\`tontineId\`),
        CONSTRAINT \`FK_sanction_tontine\` FOREIGN KEY (\`tontineId\`) REFERENCES \`tontine\` (\`id\`) ON DELETE SET NULL ON UPDATE CASCADE
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`member_sanctions_sanction\` (
        \`memberId\` int NOT NULL,
        \`sanctionId\` int NOT NULL,
        PRIMARY KEY (\`memberId\`, \`sanctionId\`),
        KEY \`FK_member_sanctions_sanction\` (\`sanctionId\`),
        CONSTRAINT \`FK_member_sanctions_member\` FOREIGN KEY (\`memberId\`) REFERENCES \`member\` (\`id\`) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT \`FK_member_sanctions_sanction\` FOREIGN KEY (\`sanctionId\`) REFERENCES \`sanction\` (\`id\`) ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`notification\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`message\` varchar(255) NOT NULL,
        \`type\` varchar(255) NOT NULL,
        \`createdAt\` datetime NOT NULL,
        \`isRead\` tinyint NOT NULL,
        \`targetId\` int NULL,
        \`tontineId\` int NULL,
        PRIMARY KEY (\`id\`),
        KEY \`FK_notification_target\` (\`targetId\`),
        KEY \`FK_notification_tontine\` (\`tontineId\`),
        CONSTRAINT \`FK_notification_target\` FOREIGN KEY (\`targetId\`) REFERENCES \`member\` (\`id\`) ON DELETE SET NULL ON UPDATE CASCADE,
        CONSTRAINT \`FK_notification_tontine\` FOREIGN KEY (\`tontineId\`) REFERENCES \`tontine\` (\`id\`) ON DELETE SET NULL ON UPDATE CASCADE
      ) ENGINE=InnoDB
    `);

    await queryRunner.query('SET FOREIGN_KEY_CHECKS = 1');

    // Brownfield deltas (existing DBs may lack these)
    const userHasMustChangePassword = await queryRunner.hasColumn(
      'user',
      'mustChangePassword',
    );
    if (!userHasMustChangePassword) {
      await queryRunner.query(`
        ALTER TABLE \`user\`
          ADD \`mustChangePassword\` tinyint NOT NULL DEFAULT 0
      `);
    }

    if (await queryRunner.hasTable('member_role')) {
      await queryRunner.query(`
        ALTER TABLE \`member_role\`
          MODIFY COLUMN \`role\` VARCHAR(50) NOT NULL DEFAULT 'TONTINARD'
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasColumn('user', 'mustChangePassword')) {
      await queryRunner.query(`
        ALTER TABLE \`user\` DROP COLUMN \`mustChangePassword\`
      `);
    }

    await queryRunner.query('SET FOREIGN_KEY_CHECKS = 0');

    const tables = [
      'notification',
      'member_sanctions_sanction',
      'sanction',
      'rapport_meeting',
      'event_participants_member',
      'event',
      'loan',
      'deposit',
      'member_role',
      'tontine_members_member',
      'tontine',
      'cash_flow',
      'part_order',
      'rate_map',
      'config_tontine',
      'member',
      'user',
    ];

    for (const table of tables) {
      if (await queryRunner.hasTable(table)) {
        await queryRunner.query(`DROP TABLE \`${table}\``);
      }
    }

    await queryRunner.query('SET FOREIGN_KEY_CHECKS = 1');
  }
}
