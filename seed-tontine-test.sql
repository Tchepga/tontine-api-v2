-- ============================================================
--  SEED : Les Amicales 2026
--  Mot de passe par défaut (tous les membres) : Tontine2026!
--  100 € / part / mois | 7 membres (5×2 parts + 2×1) | rotation 12 mois
--  4 mois de cotisations + fond pré-validés (jan–avr 2026) — fond = 10 € × nb parts / membre
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;

-- ─── 1. Utilisateurs ─────────────────────────────────────────
-- Hash bcrypt de "Tontine2026!" (généré avec bcrypt rounds=10)
INSERT INTO `user` (`username`, `password`, `roles`) VALUES
  ('ronaldo', '$2b$10$6mTfuDj6v0NWk1e.w40L9ubYtwzeuak9TOgSIhL1dyDxduGx9.nvC', 'TONTINARD'),
  ('patrick', '$2b$10$6mTfuDj6v0NWk1e.w40L9ubYtwzeuak9TOgSIhL1dyDxduGx9.nvC', 'TONTINARD'),
  ('steve',   '$2b$10$6mTfuDj6v0NWk1e.w40L9ubYtwzeuak9TOgSIhL1dyDxduGx9.nvC', 'TONTINARD'),
  ('romeo',   '$2b$10$6mTfuDj6v0NWk1e.w40L9ubYtwzeuak9TOgSIhL1dyDxduGx9.nvC', 'TONTINARD'),
  ('paola',   '$2b$10$6mTfuDj6v0NWk1e.w40L9ubYtwzeuak9TOgSIhL1dyDxduGx9.nvC', 'TONTINARD'),
  ('ryan',    '$2b$10$6mTfuDj6v0NWk1e.w40L9ubYtwzeuak9TOgSIhL1dyDxduGx9.nvC', 'TONTINARD'),
  ('albert',  '$2b$10$6mTfuDj6v0NWk1e.w40L9ubYtwzeuak9TOgSIhL1dyDxduGx9.nvC', 'TONTINARD')
ON DUPLICATE KEY UPDATE `username` = `username`;

SET @uid_ronaldo = (SELECT id FROM `user` WHERE username = 'ronaldo' LIMIT 1);
SET @uid_patrick = (SELECT id FROM `user` WHERE username = 'patrick' LIMIT 1);
SET @uid_steve   = (SELECT id FROM `user` WHERE username = 'steve'   LIMIT 1);
SET @uid_romeo   = (SELECT id FROM `user` WHERE username = 'romeo'   LIMIT 1);
SET @uid_paola   = (SELECT id FROM `user` WHERE username = 'paola'   LIMIT 1);
SET @uid_ryan    = (SELECT id FROM `user` WHERE username = 'ryan'    LIMIT 1);
SET @uid_albert  = (SELECT id FROM `user` WHERE username = 'albert'  LIMIT 1);

-- ─── 2. Membres ──────────────────────────────────────────────
INSERT INTO `member` (`firstname`, `lastname`, `email`, `phone`, `country`, `avatar`, `selectedTontineId`, `userId`)
  SELECT 'Ronaldo','XXXXX',NULL,'+33600000001','France','',NULL,@uid_ronaldo
  WHERE NOT EXISTS (SELECT 1 FROM `member` WHERE userId = @uid_ronaldo);

INSERT INTO `member` (`firstname`, `lastname`, `email`, `phone`, `country`, `avatar`, `selectedTontineId`, `userId`)
  SELECT 'Patrick','XXXXX',NULL,'+33600000002','France','',NULL,@uid_patrick
  WHERE NOT EXISTS (SELECT 1 FROM `member` WHERE userId = @uid_patrick);

INSERT INTO `member` (`firstname`, `lastname`, `email`, `phone`, `country`, `avatar`, `selectedTontineId`, `userId`)
  SELECT 'Steve',  'XXXXX',NULL,'+33600000003','France','',NULL,@uid_steve
  WHERE NOT EXISTS (SELECT 1 FROM `member` WHERE userId = @uid_steve);

INSERT INTO `member` (`firstname`, `lastname`, `email`, `phone`, `country`, `avatar`, `selectedTontineId`, `userId`)
  SELECT 'Romeo',  'XXXXX',NULL,'+33600000004','France','',NULL,@uid_romeo
  WHERE NOT EXISTS (SELECT 1 FROM `member` WHERE userId = @uid_romeo);

INSERT INTO `member` (`firstname`, `lastname`, `email`, `phone`, `country`, `avatar`, `selectedTontineId`, `userId`)
  SELECT 'Paola',  'XXXXX',NULL,'+33600000005','France','',NULL,@uid_paola
  WHERE NOT EXISTS (SELECT 1 FROM `member` WHERE userId = @uid_paola);

INSERT INTO `member` (`firstname`, `lastname`, `email`, `phone`, `country`, `avatar`, `selectedTontineId`, `userId`)
  SELECT 'Ryan',   'XXXXX',NULL,'+33600000006','France','',NULL,@uid_ryan
  WHERE NOT EXISTS (SELECT 1 FROM `member` WHERE userId = @uid_ryan);

INSERT INTO `member` (`firstname`, `lastname`, `email`, `phone`, `country`, `avatar`, `selectedTontineId`, `userId`)
  SELECT 'Albert', 'XXXXX',NULL,'+33600000007','France','',NULL,@uid_albert
  WHERE NOT EXISTS (SELECT 1 FROM `member` WHERE userId = @uid_albert);

SET @mid_ronaldo = (SELECT id FROM `member` WHERE userId = @uid_ronaldo LIMIT 1);
SET @mid_patrick = (SELECT id FROM `member` WHERE userId = @uid_patrick LIMIT 1);
SET @mid_steve   = (SELECT id FROM `member` WHERE userId = @uid_steve   LIMIT 1);
SET @mid_romeo   = (SELECT id FROM `member` WHERE userId = @uid_romeo   LIMIT 1);
SET @mid_paola   = (SELECT id FROM `member` WHERE userId = @uid_paola   LIMIT 1);
SET @mid_ryan    = (SELECT id FROM `member` WHERE userId = @uid_ryan    LIMIT 1);
SET @mid_albert  = (SELECT id FROM `member` WHERE userId = @uid_albert  LIMIT 1);

-- ─── 3. Configuration de la tontine ──────────────────────────
-- monthlyFondAmount = 10 € par part : ex. 2 parts → 20 €/mois, 1 part → 10 €/mois (120 €/mois au total)
INSERT INTO `config_tontine`
  (`defaultLoanRate`,`defaultLoanDuration`,`loopPeriod`,`minLoanAmount`,
   `countPersonPerMovement`,`movementType`,`countMaxMember`,`systemType`,
   `reminderMissingDepositsEnabled`,`loanApprovalThreshold`,`maxLoanAmount`,`monthlyFondAmount`)
VALUES
  (5, 30, 'MONTHLY', 100, 1, 'ROTATIVE', 7, 'PART', true, 51, NULL, 10.00);

SET @config_id = LAST_INSERT_ID();

-- ─── 4. Cashflow ─────────────────────────────────────────────
-- amount      = rotation : report (2 275,24) + 4×1 200 (4 800) - 3 pots (3 600) = 3 475,24 €
-- fondBalance = fond : 4 mois × 120 €/mois (5×20 + 2×10) = 480 €
INSERT INTO `cash_flow` (`amount`, `currency`, `dividendes`, `fondBalance`)
VALUES (3475.24, 'EUR', 0, 480.00);

SET @cashflow_id = LAST_INSERT_ID();

-- ─── 5. Tontine ──────────────────────────────────────────────
INSERT INTO `tontine`
  (`title`, `legacy`, `isSelected`, `configId`, `cashFlowId`)
VALUES
  ('Les Amicales 2026',
   'Cotisation mensuelle 100 € — 7 membres — rotation annuelle',
   false, @config_id, @cashflow_id);

SET @tontine_id = LAST_INSERT_ID();

-- ─── 6. Lier les membres à la tontine ────────────────────────
INSERT INTO `tontine_members_member` (`tontineId`, `memberId`) VALUES
  (@tontine_id, @mid_ronaldo),
  (@tontine_id, @mid_patrick),
  (@tontine_id, @mid_steve),
  (@tontine_id, @mid_romeo),
  (@tontine_id, @mid_paola),
  (@tontine_id, @mid_ryan),
  (@tontine_id, @mid_albert);

-- ─── 7. Rôles par tontine ─────────────────────────────────────
-- Ronaldo = PRESIDENT, Patrick = ACCOUNT_MANAGER (trésorier), autres = TONTINARD
INSERT INTO `member_role` (`role`, `userId`, `tontineId`) VALUES
  ('PRESIDENT',       @uid_ronaldo, @tontine_id),
  ('ACCOUNT_MANAGER', @uid_patrick, @tontine_id),
  ('TONTINARD',       @uid_steve,   @tontine_id),
  ('TONTINARD',       @uid_romeo,   @tontine_id),
  ('TONTINARD',       @uid_paola,   @tontine_id),
  ('TONTINARD',       @uid_ryan,    @tontine_id),
  ('TONTINARD',       @uid_albert,  @tontine_id);

-- ─── 8. Ordres de passage (12 mois 2026) ─────────────────────
-- 5 membres ont 2 parts (Ronaldo, Patrick, Steve, Ryan, Albert)
-- 2 membres ont 1 part (Romeo, Paola)
-- Chaque part = 100 € de cotisation/mois supplémentaire
INSERT INTO `part_order` (`order`, `period`, `memberId`, `configId`) VALUES
  ( 1, '2026-01-01', @mid_ronaldo, @config_id),  -- Janvier    : Ronaldo (part 1) ✅
  ( 2, '2026-02-01', @mid_patrick, @config_id),  -- Février    : Patrick (part 1) ✅
  ( 3, '2026-03-01', @mid_steve,   @config_id),  -- Mars       : Steve   (part 1) ✅
  ( 4, '2026-04-01', @mid_ronaldo, @config_id),  -- Avril      : Ronaldo (part 2) ← en cours
  ( 5, '2026-05-01', @mid_steve,   @config_id),  -- Mai        : Steve   (part 2)
  ( 6, '2026-06-01', @mid_patrick, @config_id),  -- Juin       : Patrick (part 2)
  ( 7, '2026-07-01', @mid_romeo,   @config_id),  -- Juillet    : Romeo
  ( 8, '2026-08-01', @mid_paola,   @config_id),  -- Août       : Paola
  ( 9, '2026-09-01', @mid_ryan,    @config_id),  -- Septembre  : Ryan    (part 1)
  (10, '2026-10-01', @mid_albert,  @config_id),  -- Octobre    : Albert  (part 1)
  (11, '2026-11-01', @mid_albert,  @config_id),  -- Novembre   : Albert  (part 2)
  (12, '2026-12-01', @mid_ryan,    @config_id);  -- Décembre   : Ryan    (part 2)

-- ─── 9a. Soldes reportés depuis 2025 (réunion du 11/01/2026) ────────────────
-- Ronaldo et Steve ont retiré leurs fonds → pas de report pour eux.
INSERT INTO `deposit` (`amount`, `currency`, `status`, `reasons`, `creationDate`, `comment`, `authorId`, `cashFlowId`) VALUES
  (554.31, 'EUR', 'VALIDATED', 'VERSEMENT', '2025-12-31', 'Report solde 2025 — Albert',  @mid_albert,  @cashflow_id),
  (554.31, 'EUR', 'VALIDATED', 'VERSEMENT', '2025-12-31', 'Report solde 2025 — Patrick', @mid_patrick, @cashflow_id),
  (487.31, 'EUR', 'VALIDATED', 'VERSEMENT', '2025-12-31', 'Report solde 2025 — Paola',   @mid_paola,   @cashflow_id),
  (344.54, 'EUR', 'VALIDATED', 'VERSEMENT', '2025-12-31', 'Report solde 2025 — Roméo',   @mid_romeo,   @cashflow_id),
  (334.77, 'EUR', 'VALIDATED', 'VERSEMENT', '2025-12-31', 'Report solde 2025 — Ryan',    @mid_ryan,    @cashflow_id);

-- ─── 9b. Cotisations validées — jan à avr 2026 ────────────────────────────────
-- Membres avec 2 parts : 2 dépôts × 100 € = 200 €/mois (Ronaldo, Patrick, Steve, Ryan, Albert)
-- Membres avec 1 part  : 1 dépôt  × 100 € = 100 €/mois (Romeo, Paola)
-- Total/mois = 5×200 + 2×100 = 1 200 € ✓
INSERT INTO `deposit` (`amount`, `currency`, `status`, `reasons`, `creationDate`, `comment`, `authorId`, `cashFlowId`) VALUES
  -- Janvier 2026 (1 200 €)
  (100,'EUR','VALIDATED','VERSEMENT','2026-01-05','Cotisation Janvier 2026 — part 1/2',@mid_ronaldo,@cashflow_id),
  (100,'EUR','VALIDATED','VERSEMENT','2026-01-05','Cotisation Janvier 2026 — part 2/2',@mid_ronaldo,@cashflow_id),
  (100,'EUR','VALIDATED','VERSEMENT','2026-01-05','Cotisation Janvier 2026 — part 1/2',@mid_patrick,@cashflow_id),
  (100,'EUR','VALIDATED','VERSEMENT','2026-01-05','Cotisation Janvier 2026 — part 2/2',@mid_patrick,@cashflow_id),
  (100,'EUR','VALIDATED','VERSEMENT','2026-01-05','Cotisation Janvier 2026 — part 1/2',@mid_steve,  @cashflow_id),
  (100,'EUR','VALIDATED','VERSEMENT','2026-01-05','Cotisation Janvier 2026 — part 2/2',@mid_steve,  @cashflow_id),
  (100,'EUR','VALIDATED','VERSEMENT','2026-01-05','Cotisation Janvier 2026',           @mid_romeo,  @cashflow_id),
  (100,'EUR','VALIDATED','VERSEMENT','2026-01-05','Cotisation Janvier 2026',           @mid_paola,  @cashflow_id),
  (100,'EUR','VALIDATED','VERSEMENT','2026-01-05','Cotisation Janvier 2026 — part 1/2',@mid_ryan,   @cashflow_id),
  (100,'EUR','VALIDATED','VERSEMENT','2026-01-05','Cotisation Janvier 2026 — part 2/2',@mid_ryan,   @cashflow_id),
  (100,'EUR','VALIDATED','VERSEMENT','2026-01-05','Cotisation Janvier 2026 — part 1/2',@mid_albert, @cashflow_id),
  (100,'EUR','VALIDATED','VERSEMENT','2026-01-05','Cotisation Janvier 2026 — part 2/2',@mid_albert, @cashflow_id),
  -- Février 2026 (1 200 €)
  (100,'EUR','VALIDATED','VERSEMENT','2026-02-05','Cotisation Février 2026 — part 1/2',@mid_ronaldo,@cashflow_id),
  (100,'EUR','VALIDATED','VERSEMENT','2026-02-05','Cotisation Février 2026 — part 2/2',@mid_ronaldo,@cashflow_id),
  (100,'EUR','VALIDATED','VERSEMENT','2026-02-05','Cotisation Février 2026 — part 1/2',@mid_patrick,@cashflow_id),
  (100,'EUR','VALIDATED','VERSEMENT','2026-02-05','Cotisation Février 2026 — part 2/2',@mid_patrick,@cashflow_id),
  (100,'EUR','VALIDATED','VERSEMENT','2026-02-05','Cotisation Février 2026 — part 1/2',@mid_steve,  @cashflow_id),
  (100,'EUR','VALIDATED','VERSEMENT','2026-02-05','Cotisation Février 2026 — part 2/2',@mid_steve,  @cashflow_id),
  (100,'EUR','VALIDATED','VERSEMENT','2026-02-05','Cotisation Février 2026',           @mid_romeo,  @cashflow_id),
  (100,'EUR','VALIDATED','VERSEMENT','2026-02-05','Cotisation Février 2026',           @mid_paola,  @cashflow_id),
  (100,'EUR','VALIDATED','VERSEMENT','2026-02-05','Cotisation Février 2026 — part 1/2',@mid_ryan,   @cashflow_id),
  (100,'EUR','VALIDATED','VERSEMENT','2026-02-05','Cotisation Février 2026 — part 2/2',@mid_ryan,   @cashflow_id),
  (100,'EUR','VALIDATED','VERSEMENT','2026-02-05','Cotisation Février 2026 — part 1/2',@mid_albert, @cashflow_id),
  (100,'EUR','VALIDATED','VERSEMENT','2026-02-05','Cotisation Février 2026 — part 2/2',@mid_albert, @cashflow_id),
  -- Mars 2026 (1 200 €)
  (100,'EUR','VALIDATED','VERSEMENT','2026-03-05','Cotisation Mars 2026 — part 1/2',  @mid_ronaldo,@cashflow_id),
  (100,'EUR','VALIDATED','VERSEMENT','2026-03-05','Cotisation Mars 2026 — part 2/2',  @mid_ronaldo,@cashflow_id),
  (100,'EUR','VALIDATED','VERSEMENT','2026-03-05','Cotisation Mars 2026 — part 1/2',  @mid_patrick,@cashflow_id),
  (100,'EUR','VALIDATED','VERSEMENT','2026-03-05','Cotisation Mars 2026 — part 2/2',  @mid_patrick,@cashflow_id),
  (100,'EUR','VALIDATED','VERSEMENT','2026-03-05','Cotisation Mars 2026 — part 1/2',  @mid_steve,  @cashflow_id),
  (100,'EUR','VALIDATED','VERSEMENT','2026-03-05','Cotisation Mars 2026 — part 2/2',  @mid_steve,  @cashflow_id),
  (100,'EUR','VALIDATED','VERSEMENT','2026-03-05','Cotisation Mars 2026',             @mid_romeo,  @cashflow_id),
  (100,'EUR','VALIDATED','VERSEMENT','2026-03-05','Cotisation Mars 2026',             @mid_paola,  @cashflow_id),
  (100,'EUR','VALIDATED','VERSEMENT','2026-03-05','Cotisation Mars 2026 — part 1/2',  @mid_ryan,   @cashflow_id),
  (100,'EUR','VALIDATED','VERSEMENT','2026-03-05','Cotisation Mars 2026 — part 2/2',  @mid_ryan,   @cashflow_id),
  (100,'EUR','VALIDATED','VERSEMENT','2026-03-05','Cotisation Mars 2026 — part 1/2',  @mid_albert, @cashflow_id),
  (100,'EUR','VALIDATED','VERSEMENT','2026-03-05','Cotisation Mars 2026 — part 2/2',  @mid_albert, @cashflow_id),
  -- Avril 2026 (1 200 €)
  (100,'EUR','VALIDATED','VERSEMENT','2026-04-05','Cotisation Avril 2026 — part 1/2', @mid_ronaldo,@cashflow_id),
  (100,'EUR','VALIDATED','VERSEMENT','2026-04-05','Cotisation Avril 2026 — part 2/2', @mid_ronaldo,@cashflow_id),
  (100,'EUR','VALIDATED','VERSEMENT','2026-04-05','Cotisation Avril 2026 — part 1/2', @mid_patrick,@cashflow_id),
  (100,'EUR','VALIDATED','VERSEMENT','2026-04-05','Cotisation Avril 2026 — part 2/2', @mid_patrick,@cashflow_id),
  (100,'EUR','VALIDATED','VERSEMENT','2026-04-05','Cotisation Avril 2026 — part 1/2', @mid_steve,  @cashflow_id),
  (100,'EUR','VALIDATED','VERSEMENT','2026-04-05','Cotisation Avril 2026 — part 2/2', @mid_steve,  @cashflow_id),
  (100,'EUR','VALIDATED','VERSEMENT','2026-04-05','Cotisation Avril 2026',            @mid_romeo,  @cashflow_id),
  (100,'EUR','VALIDATED','VERSEMENT','2026-04-05','Cotisation Avril 2026',            @mid_paola,  @cashflow_id),
  (100,'EUR','VALIDATED','VERSEMENT','2026-04-05','Cotisation Avril 2026 — part 1/2', @mid_ryan,   @cashflow_id),
  (100,'EUR','VALIDATED','VERSEMENT','2026-04-05','Cotisation Avril 2026 — part 2/2', @mid_ryan,   @cashflow_id),
  (100,'EUR','VALIDATED','VERSEMENT','2026-04-05','Cotisation Avril 2026 — part 1/2', @mid_albert, @cashflow_id),
  (100,'EUR','VALIDATED','VERSEMENT','2026-04-05','Cotisation Avril 2026 — part 2/2', @mid_albert, @cashflow_id);

-- ─── 9c. Contributions au fond — proportionnelles aux parts ─────────────────
-- 10 € × nb_parts/membre : 2-parts → 20 € | 1-part → 10 €
-- Total/mois : 5×20 + 2×10 = 120 € | 4 mois = 480 €
INSERT INTO `deposit` (`amount`, `currency`, `status`, `type`, `reasons`, `creationDate`, `comment`, `authorId`, `cashFlowId`) VALUES
  -- Janvier 2026 (120 €)
  (20,'EUR','VALIDATED','FOND','VERSEMENT','2026-01-05','Fond Janvier 2026 (2 parts × 10 €)',@mid_ronaldo,@cashflow_id),
  (20,'EUR','VALIDATED','FOND','VERSEMENT','2026-01-05','Fond Janvier 2026 (2 parts × 10 €)',@mid_patrick,@cashflow_id),
  (20,'EUR','VALIDATED','FOND','VERSEMENT','2026-01-05','Fond Janvier 2026 (2 parts × 10 €)',@mid_steve,  @cashflow_id),
  (10,'EUR','VALIDATED','FOND','VERSEMENT','2026-01-05','Fond Janvier 2026',                 @mid_romeo,  @cashflow_id),
  (10,'EUR','VALIDATED','FOND','VERSEMENT','2026-01-05','Fond Janvier 2026',                 @mid_paola,  @cashflow_id),
  (20,'EUR','VALIDATED','FOND','VERSEMENT','2026-01-05','Fond Janvier 2026 (2 parts × 10 €)',@mid_ryan,   @cashflow_id),
  (20,'EUR','VALIDATED','FOND','VERSEMENT','2026-01-05','Fond Janvier 2026 (2 parts × 10 €)',@mid_albert, @cashflow_id),
  -- Février 2026 (120 €)
  (20,'EUR','VALIDATED','FOND','VERSEMENT','2026-02-05','Fond Février 2026 (2 parts × 10 €)',@mid_ronaldo,@cashflow_id),
  (20,'EUR','VALIDATED','FOND','VERSEMENT','2026-02-05','Fond Février 2026 (2 parts × 10 €)',@mid_patrick,@cashflow_id),
  (20,'EUR','VALIDATED','FOND','VERSEMENT','2026-02-05','Fond Février 2026 (2 parts × 10 €)',@mid_steve,  @cashflow_id),
  (10,'EUR','VALIDATED','FOND','VERSEMENT','2026-02-05','Fond Février 2026',                 @mid_romeo,  @cashflow_id),
  (10,'EUR','VALIDATED','FOND','VERSEMENT','2026-02-05','Fond Février 2026',                 @mid_paola,  @cashflow_id),
  (20,'EUR','VALIDATED','FOND','VERSEMENT','2026-02-05','Fond Février 2026 (2 parts × 10 €)',@mid_ryan,   @cashflow_id),
  (20,'EUR','VALIDATED','FOND','VERSEMENT','2026-02-05','Fond Février 2026 (2 parts × 10 €)',@mid_albert, @cashflow_id),
  -- Mars 2026 (120 €)
  (20,'EUR','VALIDATED','FOND','VERSEMENT','2026-03-05','Fond Mars 2026 (2 parts × 10 €)',   @mid_ronaldo,@cashflow_id),
  (20,'EUR','VALIDATED','FOND','VERSEMENT','2026-03-05','Fond Mars 2026 (2 parts × 10 €)',   @mid_patrick,@cashflow_id),
  (20,'EUR','VALIDATED','FOND','VERSEMENT','2026-03-05','Fond Mars 2026 (2 parts × 10 €)',   @mid_steve,  @cashflow_id),
  (10,'EUR','VALIDATED','FOND','VERSEMENT','2026-03-05','Fond Mars 2026',                    @mid_romeo,  @cashflow_id),
  (10,'EUR','VALIDATED','FOND','VERSEMENT','2026-03-05','Fond Mars 2026',                    @mid_paola,  @cashflow_id),
  (20,'EUR','VALIDATED','FOND','VERSEMENT','2026-03-05','Fond Mars 2026 (2 parts × 10 €)',   @mid_ryan,   @cashflow_id),
  (20,'EUR','VALIDATED','FOND','VERSEMENT','2026-03-05','Fond Mars 2026 (2 parts × 10 €)',   @mid_albert, @cashflow_id),
  -- Avril 2026 (120 €)
  (20,'EUR','VALIDATED','FOND','VERSEMENT','2026-04-05','Fond Avril 2026 (2 parts × 10 €)',  @mid_ronaldo,@cashflow_id),
  (20,'EUR','VALIDATED','FOND','VERSEMENT','2026-04-05','Fond Avril 2026 (2 parts × 10 €)',  @mid_patrick,@cashflow_id),
  (20,'EUR','VALIDATED','FOND','VERSEMENT','2026-04-05','Fond Avril 2026 (2 parts × 10 €)',  @mid_steve,  @cashflow_id),
  (10,'EUR','VALIDATED','FOND','VERSEMENT','2026-04-05','Fond Avril 2026',                   @mid_romeo,  @cashflow_id),
  (10,'EUR','VALIDATED','FOND','VERSEMENT','2026-04-05','Fond Avril 2026',                   @mid_paola,  @cashflow_id),
  (20,'EUR','VALIDATED','FOND','VERSEMENT','2026-04-05','Fond Avril 2026 (2 parts × 10 €)',  @mid_ryan,   @cashflow_id),
  (20,'EUR','VALIDATED','FOND','VERSEMENT','2026-04-05','Fond Avril 2026 (2 parts × 10 €)',  @mid_albert, @cashflow_id);

-- ─── 10. selectedTontineId pour chaque membre ────────────────
UPDATE `member` SET `selectedTontineId` = @tontine_id
WHERE id IN (@mid_ronaldo,@mid_patrick,@mid_steve,@mid_romeo,@mid_paola,@mid_ryan,@mid_albert);

SET FOREIGN_KEY_CHECKS = 1;

-- ─── Résumé ───────────────────────────────────────────────────
SELECT CONCAT('✅ Tontine créée — ID: ', @tontine_id, ' | Config: ', @config_id) AS result;

SELECT 'Membres et rôles' AS info;
SELECT m.firstname, u.username, mr.role AS role_tontine
FROM member m
JOIN `user` u ON u.id = m.userId
JOIN member_role mr ON mr.userId = u.id AND mr.tontineId = @tontine_id
ORDER BY FIELD(mr.role, 'PRESIDENT','ACCOUNT_MANAGER','SECRETARY','TONTINARD');

SELECT 'Ordre de passage 2026' AS planning;
SELECT
  po.order AS num,
  DATE_FORMAT(po.period, '%M %Y') AS mois,
  m.firstname AS beneficiaire,
  IF(po.period <= CURDATE(), '✅ passé', '⏳ à venir') AS statut
FROM part_order po
JOIN member m ON m.id = po.memberId
WHERE po.configId = @config_id
ORDER BY po.order;

SELECT CONCAT('Cotisations rotation : ', IFNULL(ROUND(SUM(amount), 2), 0), ' EUR (', COUNT(*), ' lignes)') AS resume_cotisations
FROM deposit WHERE cashFlowId = @cashflow_id AND comment LIKE 'Cotisation%';

SELECT CONCAT('Contributions fond : ', IFNULL(ROUND(SUM(amount), 2), 0), ' EUR (', COUNT(*), ' lignes)') AS resume_fond
FROM deposit WHERE cashFlowId = @cashflow_id AND `type` = 'FOND';
