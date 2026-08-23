-- Remplace l'ENUM MySQL (souvent incomplet) par VARCHAR pour accepter
-- tous les rôles : PRESIDENT, VICE_PRESIDENT, ACCOUNT_MANAGER,
-- OFFICE_MANAGER, SECRETARY, TONTINARD.
--
-- Préférer la migration TypeORM :
--   npm run migration:run
-- (voir src/database/migrations/1755945600000-InitialSchema.ts)
--
-- Usage manuel (prod / staging) :
--   mysql -u... -p... tontine < scripts/sql/fix-member-role-column.sql

ALTER TABLE `member_role`
  MODIFY COLUMN `role` VARCHAR(50) NOT NULL DEFAULT 'TONTINARD';
