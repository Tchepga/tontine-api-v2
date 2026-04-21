-- ============================================================
--  SEED : Tontine des Amis 2025
--  Mot de passe par défaut (tous les membres) : Tontine2025!
--  Ordre de passage mensuel configuré pour 2025
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;

-- ─── 1. Utilisateurs ─────────────────────────────────────────
INSERT INTO `user` (`username`, `password`, `roles`) VALUES
  ('ronaldo', '$2b$10$6mTfuDj6v0NWk1e.w40L9ubYtwzeuak9TOgSIhL1dyDxduGx9.nvC', 'TONTINARD'),
  ('patrick', '$2b$10$6mTfuDj6v0NWk1e.w40L9ubYtwzeuak9TOgSIhL1dyDxduGx9.nvC', 'TONTINARD'),
  ('steve',   '$2b$10$6mTfuDj6v0NWk1e.w40L9ubYtwzeuak9TOgSIhL1dyDxduGx9.nvC', 'TONTINARD'),
  ('romeo',   '$2b$10$6mTfuDj6v0NWk1e.w40L9ubYtwzeuak9TOgSIhL1dyDxduGx9.nvC', 'TONTINARD'),
  ('paola',   '$2b$10$6mTfuDj6v0NWk1e.w40L9ubYtwzeuak9TOgSIhL1dyDxduGx9.nvC', 'TONTINARD'),
  ('ryan',    '$2b$10$6mTfuDj6v0NWk1e.w40L9ubYtwzeuak9TOgSIhL1dyDxduGx9.nvC', 'TONTINARD'),
  ('albert',  '$2b$10$6mTfuDj6v0NWk1e.w40L9ubYtwzeuak9TOgSIhL1dyDxduGx9.nvC', 'TONTINARD')
ON DUPLICATE KEY UPDATE `username` = `username`;

-- Récupérer les IDs utilisateurs
SET @uid_ronaldo = (SELECT id FROM `user` WHERE username = 'ronaldo' LIMIT 1);
SET @uid_patrick = (SELECT id FROM `user` WHERE username = 'patrick' LIMIT 1);
SET @uid_steve   = (SELECT id FROM `user` WHERE username = 'steve'   LIMIT 1);
SET @uid_romeo   = (SELECT id FROM `user` WHERE username = 'romeo'   LIMIT 1);
SET @uid_paola   = (SELECT id FROM `user` WHERE username = 'paola'   LIMIT 1);
SET @uid_ryan    = (SELECT id FROM `user` WHERE username = 'ryan'    LIMIT 1);
SET @uid_albert  = (SELECT id FROM `user` WHERE username = 'albert'  LIMIT 1);

-- ─── 2. Membres ──────────────────────────────────────────────
INSERT INTO `member` (`firstname`, `lastname`, `email`, `phone`, `country`, `avatar`, `selectedTontineId`, `userId`)
  SELECT 'Ronaldo','Silva',   NULL,'+237600000001','Cameroun','',NULL,@uid_ronaldo
  WHERE NOT EXISTS (SELECT 1 FROM `member` WHERE userId = @uid_ronaldo);

INSERT INTO `member` (`firstname`, `lastname`, `email`, `phone`, `country`, `avatar`, `selectedTontineId`, `userId`)
  SELECT 'Patrick','Tchepga', NULL,'+237600000002','Cameroun','',NULL,@uid_patrick
  WHERE NOT EXISTS (SELECT 1 FROM `member` WHERE userId = @uid_patrick);

INSERT INTO `member` (`firstname`, `lastname`, `email`, `phone`, `country`, `avatar`, `selectedTontineId`, `userId`)
  SELECT 'Steve',  'Martin',  NULL,'+237600000003','Cameroun','',NULL,@uid_steve
  WHERE NOT EXISTS (SELECT 1 FROM `member` WHERE userId = @uid_steve);

INSERT INTO `member` (`firstname`, `lastname`, `email`, `phone`, `country`, `avatar`, `selectedTontineId`, `userId`)
  SELECT 'Romeo',  'Fontaine',NULL,'+237600000004','Cameroun','',NULL,@uid_romeo
  WHERE NOT EXISTS (SELECT 1 FROM `member` WHERE userId = @uid_romeo);

INSERT INTO `member` (`firstname`, `lastname`, `email`, `phone`, `country`, `avatar`, `selectedTontineId`, `userId`)
  SELECT 'Paola',  'Dupont',  NULL,'+237600000005','Cameroun','',NULL,@uid_paola
  WHERE NOT EXISTS (SELECT 1 FROM `member` WHERE userId = @uid_paola);

INSERT INTO `member` (`firstname`, `lastname`, `email`, `phone`, `country`, `avatar`, `selectedTontineId`, `userId`)
  SELECT 'Ryan',   'Bernard', NULL,'+237600000006','Cameroun','',NULL,@uid_ryan
  WHERE NOT EXISTS (SELECT 1 FROM `member` WHERE userId = @uid_ryan);

INSERT INTO `member` (`firstname`, `lastname`, `email`, `phone`, `country`, `avatar`, `selectedTontineId`, `userId`)
  SELECT 'Albert', 'Kamga',   NULL,'+237600000007','Cameroun','',NULL,@uid_albert
  WHERE NOT EXISTS (SELECT 1 FROM `member` WHERE userId = @uid_albert);

-- Récupérer les IDs membres
SET @mid_ronaldo = (SELECT id FROM `member` WHERE userId = @uid_ronaldo LIMIT 1);
SET @mid_patrick = (SELECT id FROM `member` WHERE userId = @uid_patrick LIMIT 1);
SET @mid_steve   = (SELECT id FROM `member` WHERE userId = @uid_steve   LIMIT 1);
SET @mid_romeo   = (SELECT id FROM `member` WHERE userId = @uid_romeo   LIMIT 1);
SET @mid_paola   = (SELECT id FROM `member` WHERE userId = @uid_paola   LIMIT 1);
SET @mid_ryan    = (SELECT id FROM `member` WHERE userId = @uid_ryan    LIMIT 1);
SET @mid_albert  = (SELECT id FROM `member` WHERE userId = @uid_albert  LIMIT 1);

-- ─── 3. Configuration de la tontine ──────────────────────────
INSERT INTO `config_tontine`
  (`defaultLoanRate`,`defaultLoanDuration`,`loopPeriod`,`minLoanAmount`,
   `countPersonPerMovement`,`movementType`,`countMaxMember`,`systemType`,
   `reminderMissingDepositsEnabled`,`loanApprovalThreshold`,`maxLoanAmount`)
VALUES
  (5, 30, 'MONTHLY', 10000, 1, 'ROTATIVE', 7, 'PART', true, 51, NULL);

SET @config_id = LAST_INSERT_ID();

-- ─── 4. Cashflow ─────────────────────────────────────────────
INSERT INTO `cash_flow` (`amount`, `currency`, `dividendes`)
VALUES (0, 'FCFA', 0);

SET @cashflow_id = LAST_INSERT_ID();

-- ─── 5. Tontine ──────────────────────────────────────────────
INSERT INTO `tontine`
  (`title`, `legacy`, `isSelected`, `configId`, `cashFlowId`)
VALUES
  ('Tontine des Amis 2025',
   'Tontine de test — cotisation mensuelle FCFA',
   false, @config_id, @cashflow_id);

SET @tontine_id = LAST_INSERT_ID();

-- ─── 6. Lier les membres à la tontine (table de jointure) ────
INSERT INTO `tontine_members_member` (`tontineId`, `memberId`) VALUES
  (@tontine_id, @mid_ronaldo),
  (@tontine_id, @mid_patrick),
  (@tontine_id, @mid_steve),
  (@tontine_id, @mid_romeo),
  (@tontine_id, @mid_paola),
  (@tontine_id, @mid_ryan),
  (@tontine_id, @mid_albert);

-- ─── 7. Rôles par tontine ─────────────────────────────────────
-- Albert = PRESIDENT, autres = TONTINARD
INSERT INTO `member_role` (`role`, `userId`, `tontineId`) VALUES
  ('TONTINARD',       @uid_ronaldo, @tontine_id),
  ('TONTINARD',       @uid_patrick, @tontine_id),
  ('TONTINARD',       @uid_steve,   @tontine_id),
  ('TONTINARD',       @uid_romeo,   @tontine_id),
  ('TONTINARD',       @uid_paola,   @tontine_id),
  ('TONTINARD',       @uid_ryan,    @tontine_id),
  ('PRESIDENT',       @uid_albert,  @tontine_id);

-- ─── 8. Ordres de passage (12 mois 2025) ─────────────────────
-- period = 1er jour du mois correspondant
INSERT INTO `part_order` (`order`, `period`, `memberId`, `configId`) VALUES
  ( 1, '2025-01-01', @mid_ronaldo, @config_id),  -- Janvier  : Ronaldo
  ( 2, '2025-02-01', @mid_patrick, @config_id),  -- Février  : Patrick
  ( 3, '2025-03-01', @mid_steve,   @config_id),  -- Mars     : Steve
  ( 4, '2025-04-01', @mid_ronaldo, @config_id),  -- Avril    : Ronaldo
  ( 5, '2025-05-01', @mid_steve,   @config_id),  -- Mai      : Steve
  ( 6, '2025-06-01', @mid_patrick, @config_id),  -- Juin     : Patrick
  ( 7, '2025-07-01', @mid_romeo,   @config_id),  -- Juillet  : Romeo
  ( 8, '2025-08-01', @mid_paola,   @config_id),  -- Août     : Paola
  ( 9, '2025-09-01', @mid_ryan,    @config_id),  -- Septembre: Ryan
  (10, '2025-10-01', @mid_albert,  @config_id),  -- Octobre  : Albert
  (11, '2025-11-01', @mid_albert,  @config_id),  -- Novembre : Albert
  (12, '2025-12-01', @mid_ryan,    @config_id);  -- Décembre : Ryan

-- ─── 9. Mettre à jour selectedTontineId de chaque membre ─────
UPDATE `member` SET `selectedTontineId` = @tontine_id
WHERE id IN (@mid_ronaldo,@mid_patrick,@mid_steve,@mid_romeo,@mid_paola,@mid_ryan,@mid_albert);

SET FOREIGN_KEY_CHECKS = 1;

-- ─── Résumé ───────────────────────────────────────────────────
SELECT CONCAT('✅ Tontine créée — ID: ', @tontine_id, ' | Config: ', @config_id) AS result;
SELECT 'Identifiants (mot de passe : Tontine2025!)' AS info;
SELECT
  m.firstname, m.lastname, u.username,
  mr.role AS role_tontine,
  m.id AS membre_id
FROM member m
JOIN `user` u ON u.id = m.userId
JOIN member_role mr ON mr.userId = u.id AND mr.tontineId = @tontine_id
ORDER BY m.id;

SELECT 'Ordre de passage 2025' AS planning;
SELECT
  po.order AS num_passage,
  DATE_FORMAT(po.period, '%M %Y') AS mois,
  m.firstname AS beneficiaire
FROM part_order po
JOIN member m ON m.id = po.memberId
WHERE po.configId = @config_id
ORDER BY po.order;
