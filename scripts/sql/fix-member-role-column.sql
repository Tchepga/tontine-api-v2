-- Remplace l'ENUM MySQL (souvent incomplet) par VARCHAR pour accepter
-- tous les rôles : PRESIDENT, VICE_PRESIDENT, ACCOUNT_MANAGER,
-- OFFICE_MANAGER, SECRETARY, TONTINARD.
--
-- Usage (prod / staging) :
--   mysql -u... -p... tontine < scripts/sql/fix-member-role-column.sql

ALTER TABLE `member_role`
  MODIFY COLUMN `role` VARCHAR(50) NOT NULL DEFAULT 'TONTINARD';
