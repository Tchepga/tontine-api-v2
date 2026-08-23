import { MigrationInterface, QueryRunner } from 'typeorm';

export class TontineLifecycle1755945700000 implements MigrationInterface {
  name = 'TontineLifecycle1755945700000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const columns: { name: string; ddl: string }[] = [
      {
        name: 'status',
        ddl: "ADD COLUMN `status` varchar(20) NOT NULL DEFAULT 'ACTIVE'",
      },
      { name: 'parentTontineId', ddl: 'ADD COLUMN `parentTontineId` int NULL' },
      { name: 'closedAt', ddl: 'ADD COLUMN `closedAt` datetime NULL' },
      { name: 'closureSnapshot', ddl: 'ADD COLUMN `closureSnapshot` json NULL' },
    ];

    for (const column of columns) {
      const existing = await queryRunner.query(`
        SELECT COUNT(*) AS cnt
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'tontine'
          AND COLUMN_NAME = '${column.name}'
      `);
      if (Number(existing[0]?.cnt ?? 0) === 0) {
        await queryRunner.query(
          `ALTER TABLE \`tontine\` ${column.ddl}`,
        );
      }
    }

    const fkExists = await queryRunner.query(`
      SELECT COUNT(*) AS cnt
      FROM information_schema.TABLE_CONSTRAINTS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'tontine'
        AND CONSTRAINT_NAME = 'FK_tontine_parent'
    `);
    if (Number(fkExists[0]?.cnt ?? 0) === 0) {
      await queryRunner.query(`
        ALTER TABLE \`tontine\`
          ADD KEY \`FK_tontine_parent\` (\`parentTontineId\`),
          ADD CONSTRAINT \`FK_tontine_parent\`
            FOREIGN KEY (\`parentTontineId\`) REFERENCES \`tontine\` (\`id\`)
            ON DELETE SET NULL ON UPDATE CASCADE
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`tontine\`
        DROP FOREIGN KEY \`FK_tontine_parent\`
    `).catch(() => undefined);

    await queryRunner.query(`
      ALTER TABLE \`tontine\`
        DROP COLUMN \`closureSnapshot\`,
        DROP COLUMN \`closedAt\`,
        DROP COLUMN \`parentTontineId\`,
        DROP COLUMN \`status\`
    `);
  }
}
