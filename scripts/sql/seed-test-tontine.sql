-- ============================================================
--  Seed « Les Amicales 2026 » — miroir de src/seed-test-tontine.ts
--  Mot de passe : Tontine2026!  |  user.roles = TONTINARD (rôles tontine dans member_role)
--  Schéma : user.username PK ; member.userUsername ; deposit sans type/comment ;
--           cash_flow : amount, currency, dividendes (pas fondBalance)
--  Pot rotation amount = carryOver + 4×1200 − 3×1200 = 3475,24 €
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;

-- ─── 1. Utilisateurs (tous TONTINARD côté user, comme le TS) ─
INSERT INTO `user` (`username`, `password`, `roles`) VALUES
  ('ronaldo', '$2b$10$6mTfuDj6v0NWk1e.w40L9ubYtwzeuak9TOgSIhL1dyDxduGx9.nvC', 'TONTINARD'),
  ('patrick', '$2b$10$6mTfuDj6v0NWk1e.w40L9ubYtwzeuak9TOgSIhL1dyDxduGx9.nvC', 'TONTINARD'),
  ('steve',   '$2b$10$6mTfuDj6v0NWk1e.w40L9ubYtwzeuak9TOgSIhL1dyDxduGx9.nvC', 'TONTINARD'),
  ('romeo',   '$2b$10$6mTfuDj6v0NWk1e.w40L9ubYtwzeuak9TOgSIhL1dyDxduGx9.nvC', 'TONTINARD'),
  ('paola',   '$2b$10$6mTfuDj6v0NWk1e.w40L9ubYtwzeuak9TOgSIhL1dyDxduGx9.nvC', 'TONTINARD'),
  ('ryan',    '$2b$10$6mTfuDj6v0NWk1e.w40L9ubYtwzeuak9TOgSIhL1dyDxduGx9.nvC', 'TONTINARD'),
  ('albert',  '$2b$10$6mTfuDj6v0NWk1e.w40L9ubYtwzeuak9TOgSIhL1dyDxduGx9.nvC', 'TONTINARD')
ON DUPLICATE KEY UPDATE `username` = `username`;

SET @u_ronaldo := 'ronaldo';
SET @u_patrick := 'patrick';
SET @u_steve   := 'steve';
SET @u_romeo   := 'romeo';
SET @u_paola   := 'paola';
SET @u_ryan    := 'ryan';
SET @u_albert  := 'albert';

-- ─── 2. Membres (téléphones +33600000001…07 comme le TS) ─────
INSERT INTO `member` (`firstname`, `lastname`, `email`, `phone`, `country`, `avatar`, `isActive`, `userUsername`)
  SELECT 'Ronaldo','Silva',  NULL,'+33600000001','France','',1,@u_ronaldo
  WHERE NOT EXISTS (SELECT 1 FROM `member` WHERE `userUsername` = @u_ronaldo);

INSERT INTO `member` (`firstname`, `lastname`, `email`, `phone`, `country`, `avatar`, `isActive`, `userUsername`)
  SELECT 'Patrick','Tchepga',NULL,'+33600000002','France','',1,@u_patrick
  WHERE NOT EXISTS (SELECT 1 FROM `member` WHERE `userUsername` = @u_patrick);

INSERT INTO `member` (`firstname`, `lastname`, `email`, `phone`, `country`, `avatar`, `isActive`, `userUsername`)
  SELECT 'Steve',  'XXXXX', NULL,'+33600000003','France','',1,@u_steve
  WHERE NOT EXISTS (SELECT 1 FROM `member` WHERE `userUsername` = @u_steve);

INSERT INTO `member` (`firstname`, `lastname`, `email`, `phone`, `country`, `avatar`, `isActive`, `userUsername`)
  SELECT 'Romeo',  'XXXXX', NULL,'+33600000004','France','',1,@u_romeo
  WHERE NOT EXISTS (SELECT 1 FROM `member` WHERE `userUsername` = @u_romeo);

INSERT INTO `member` (`firstname`, `lastname`, `email`, `phone`, `country`, `avatar`, `isActive`, `userUsername`)
  SELECT 'Paola',  'XXXXX', NULL,'+33600000005','France','',1,@u_paola
  WHERE NOT EXISTS (SELECT 1 FROM `member` WHERE `userUsername` = @u_paola);

INSERT INTO `member` (`firstname`, `lastname`, `email`, `phone`, `country`, `avatar`, `isActive`, `userUsername`)
  SELECT 'Ryan',   'XXXXX', NULL,'+33600000006','France','',1,@u_ryan
  WHERE NOT EXISTS (SELECT 1 FROM `member` WHERE `userUsername` = @u_ryan);

INSERT INTO `member` (`firstname`, `lastname`, `email`, `phone`, `country`, `avatar`, `isActive`, `userUsername`)
  SELECT 'Albert', 'Kamga',  NULL,'+33600000007','France','',1,@u_albert
  WHERE NOT EXISTS (SELECT 1 FROM `member` WHERE `userUsername` = @u_albert);

SET @mid_ronaldo = (SELECT id FROM `member` WHERE `userUsername` = @u_ronaldo LIMIT 1);
SET @mid_patrick = (SELECT id FROM `member` WHERE `userUsername` = @u_patrick LIMIT 1);
SET @mid_steve   = (SELECT id FROM `member` WHERE `userUsername` = @u_steve   LIMIT 1);
SET @mid_romeo   = (SELECT id FROM `member` WHERE `userUsername` = @u_romeo   LIMIT 1);
SET @mid_paola   = (SELECT id FROM `member` WHERE `userUsername` = @u_paola   LIMIT 1);
SET @mid_ryan    = (SELECT id FROM `member` WHERE `userUsername` = @u_ryan    LIMIT 1);
SET @mid_albert  = (SELECT id FROM `member` WHERE `userUsername` = @u_albert  LIMIT 1);

-- ─── 3. Config, cashflow (3475,24 = reports + 4800 − 3600), tontine ─
INSERT INTO `config_tontine`
  (`defaultLoanRate`,`defaultLoanDuration`,`loopPeriod`,`minLoanAmount`,
   `countPersonPerMovement`,`movementType`,`countMaxMember`,`systemType`)
VALUES
  (5, 30, 'MONTHLY', 100, 1, 'ROTATIVE', 7, 'PART');

SET @config_id = LAST_INSERT_ID();

INSERT INTO `cash_flow` (`amount`, `currency`, `dividendes`)
VALUES (3475.24, 'EUR', 0);

SET @cashflow_id = LAST_INSERT_ID();

INSERT INTO `tontine` (`title`, `legacy`, `isSelected`, `isActive`, `configId`, `cashFlowId`)
VALUES
  ('Les Amicales 2026',
   'Cotisation 100 € / part — 7 membres — rotation 2026',
   0, 1, @config_id, @cashflow_id);

SET @tontine_id = LAST_INSERT_ID();

INSERT INTO `tontine_members_member` (`tontineId`, `memberId`) VALUES
  (@tontine_id, @mid_ronaldo),
  (@tontine_id, @mid_patrick),
  (@tontine_id, @mid_steve),
  (@tontine_id, @mid_romeo),
  (@tontine_id, @mid_paola),
  (@tontine_id, @mid_ryan),
  (@tontine_id, @mid_albert);

INSERT INTO `member_role` (`role`, `userUsername`, `tontineId`) VALUES
  ('PRESIDENT',       @u_ronaldo, @tontine_id),
  ('ACCOUNT_MANAGER', @u_patrick, @tontine_id),
  ('TONTINARD',       @u_steve,   @tontine_id),
  ('TONTINARD',       @u_romeo,   @tontine_id),
  ('TONTINARD',       @u_paola,   @tontine_id),
  ('TONTINARD',       @u_ryan,    @tontine_id),
  ('TONTINARD',       @u_albert,  @tontine_id);

-- ─── 4. Ordres de passage = PART_ORDERS du TS ────────────────
INSERT INTO `part_order` (`order`, `period`, `memberId`, `configId`) VALUES
  ( 1, '2026-01-01', @mid_ronaldo, @config_id),
  ( 2, '2026-02-01', @mid_patrick, @config_id),
  ( 3, '2026-03-01', @mid_steve,   @config_id),
  ( 4, '2026-04-01', @mid_ronaldo, @config_id),
  ( 5, '2026-05-01', @mid_steve,   @config_id),
  ( 6, '2026-06-01', @mid_patrick, @config_id),
  ( 7, '2026-07-01', @mid_romeo,   @config_id),
  ( 8, '2026-08-01', @mid_paola,   @config_id),
  ( 9, '2026-09-01', @mid_ryan,    @config_id),
  (10, '2026-10-01', @mid_albert,  @config_id),
  (11, '2026-11-01', @mid_albert,  @config_id),
  (12, '2026-12-01', @mid_ryan,    @config_id);

-- ─── 5a. Reports 2025 (CARRY_OVER du TS) ──────────────────────
INSERT INTO `deposit` (`amount`, `currency`, `status`, `creationDate`, `reasons`, `authorId`, `cashFlowId`) VALUES
  (554.31, 'EUR', 'VALIDATED', '2025-12-31', 'Report solde 2025 — Albert',  @mid_albert,  @cashflow_id),
  (554.31, 'EUR', 'VALIDATED', '2025-12-31', 'Report solde 2025 — Patrick', @mid_patrick, @cashflow_id),
  (487.31, 'EUR', 'VALIDATED', '2025-12-31', 'Report solde 2025 — Paola',   @mid_paola,   @cashflow_id),
  (344.54, 'EUR', 'VALIDATED', '2025-12-31', 'Report solde 2025 — Romeo',   @mid_romeo,   @cashflow_id),
  (334.77, 'EUR', 'VALIDATED', '2025-12-31', 'Report solde 2025 — Ryan',    @mid_ryan,    @cashflow_id);

-- ─── 5b. Cotisations jan–avr (100 € × parts, reasons = buildCotisationReason) ─
INSERT INTO `deposit` (`amount`, `currency`, `status`, `creationDate`, `reasons`, `authorId`, `cashFlowId`) VALUES
  -- Janvier 2026 (1 200 €)
  (100,'EUR','VALIDATED','2026-01-05','Cotisation Janvier 2026 — part 1/2',@mid_ronaldo,@cashflow_id),
  (100,'EUR','VALIDATED','2026-01-05','Cotisation Janvier 2026 — part 2/2',@mid_ronaldo,@cashflow_id),
  (100,'EUR','VALIDATED','2026-01-05','Cotisation Janvier 2026 — part 1/2',@mid_patrick,@cashflow_id),
  (100,'EUR','VALIDATED','2026-01-05','Cotisation Janvier 2026 — part 2/2',@mid_patrick,@cashflow_id),
  (100,'EUR','VALIDATED','2026-01-05','Cotisation Janvier 2026 — part 1/2',@mid_steve,  @cashflow_id),
  (100,'EUR','VALIDATED','2026-01-05','Cotisation Janvier 2026 — part 2/2',@mid_steve,  @cashflow_id),
  (100,'EUR','VALIDATED','2026-01-05','Cotisation Janvier 2026',           @mid_romeo,  @cashflow_id),
  (100,'EUR','VALIDATED','2026-01-05','Cotisation Janvier 2026',           @mid_paola,  @cashflow_id),
  (100,'EUR','VALIDATED','2026-01-05','Cotisation Janvier 2026 — part 1/2',@mid_ryan,   @cashflow_id),
  (100,'EUR','VALIDATED','2026-01-05','Cotisation Janvier 2026 — part 2/2',@mid_ryan,   @cashflow_id),
  (100,'EUR','VALIDATED','2026-01-05','Cotisation Janvier 2026 — part 1/2',@mid_albert, @cashflow_id),
  (100,'EUR','VALIDATED','2026-01-05','Cotisation Janvier 2026 — part 2/2',@mid_albert, @cashflow_id),
  -- Février 2026
  (100,'EUR','VALIDATED','2026-02-05','Cotisation Février 2026 — part 1/2',@mid_ronaldo,@cashflow_id),
  (100,'EUR','VALIDATED','2026-02-05','Cotisation Février 2026 — part 2/2',@mid_ronaldo,@cashflow_id),
  (100,'EUR','VALIDATED','2026-02-05','Cotisation Février 2026 — part 1/2',@mid_patrick,@cashflow_id),
  (100,'EUR','VALIDATED','2026-02-05','Cotisation Février 2026 — part 2/2',@mid_patrick,@cashflow_id),
  (100,'EUR','VALIDATED','2026-02-05','Cotisation Février 2026 — part 1/2',@mid_steve,  @cashflow_id),
  (100,'EUR','VALIDATED','2026-02-05','Cotisation Février 2026 — part 2/2',@mid_steve,  @cashflow_id),
  (100,'EUR','VALIDATED','2026-02-05','Cotisation Février 2026',           @mid_romeo,  @cashflow_id),
  (100,'EUR','VALIDATED','2026-02-05','Cotisation Février 2026',           @mid_paola,  @cashflow_id),
  (100,'EUR','VALIDATED','2026-02-05','Cotisation Février 2026 — part 1/2',@mid_ryan,   @cashflow_id),
  (100,'EUR','VALIDATED','2026-02-05','Cotisation Février 2026 — part 2/2',@mid_ryan,   @cashflow_id),
  (100,'EUR','VALIDATED','2026-02-05','Cotisation Février 2026 — part 1/2',@mid_albert, @cashflow_id),
  (100,'EUR','VALIDATED','2026-02-05','Cotisation Février 2026 — part 2/2',@mid_albert, @cashflow_id),
  -- Mars 2026
  (100,'EUR','VALIDATED','2026-03-05','Cotisation Mars 2026 — part 1/2',  @mid_ronaldo,@cashflow_id),
  (100,'EUR','VALIDATED','2026-03-05','Cotisation Mars 2026 — part 2/2',  @mid_ronaldo,@cashflow_id),
  (100,'EUR','VALIDATED','2026-03-05','Cotisation Mars 2026 — part 1/2',  @mid_patrick,@cashflow_id),
  (100,'EUR','VALIDATED','2026-03-05','Cotisation Mars 2026 — part 2/2',  @mid_patrick,@cashflow_id),
  (100,'EUR','VALIDATED','2026-03-05','Cotisation Mars 2026 — part 1/2',  @mid_steve,  @cashflow_id),
  (100,'EUR','VALIDATED','2026-03-05','Cotisation Mars 2026 — part 2/2',  @mid_steve,  @cashflow_id),
  (100,'EUR','VALIDATED','2026-03-05','Cotisation Mars 2026',             @mid_romeo,  @cashflow_id),
  (100,'EUR','VALIDATED','2026-03-05','Cotisation Mars 2026',             @mid_paola,  @cashflow_id),
  (100,'EUR','VALIDATED','2026-03-05','Cotisation Mars 2026 — part 1/2',  @mid_ryan,   @cashflow_id),
  (100,'EUR','VALIDATED','2026-03-05','Cotisation Mars 2026 — part 2/2',  @mid_ryan,   @cashflow_id),
  (100,'EUR','VALIDATED','2026-03-05','Cotisation Mars 2026 — part 1/2',  @mid_albert, @cashflow_id),
  (100,'EUR','VALIDATED','2026-03-05','Cotisation Mars 2026 — part 2/2',  @mid_albert, @cashflow_id),
  -- Avril 2026
  (100,'EUR','VALIDATED','2026-04-05','Cotisation Avril 2026 — part 1/2', @mid_ronaldo,@cashflow_id),
  (100,'EUR','VALIDATED','2026-04-05','Cotisation Avril 2026 — part 2/2', @mid_ronaldo,@cashflow_id),
  (100,'EUR','VALIDATED','2026-04-05','Cotisation Avril 2026 — part 1/2', @mid_patrick,@cashflow_id),
  (100,'EUR','VALIDATED','2026-04-05','Cotisation Avril 2026 — part 2/2', @mid_patrick,@cashflow_id),
  (100,'EUR','VALIDATED','2026-04-05','Cotisation Avril 2026 — part 1/2', @mid_steve,  @cashflow_id),
  (100,'EUR','VALIDATED','2026-04-05','Cotisation Avril 2026 — part 2/2', @mid_steve,  @cashflow_id),
  (100,'EUR','VALIDATED','2026-04-05','Cotisation Avril 2026',            @mid_romeo,  @cashflow_id),
  (100,'EUR','VALIDATED','2026-04-05','Cotisation Avril 2026',            @mid_paola,  @cashflow_id),
  (100,'EUR','VALIDATED','2026-04-05','Cotisation Avril 2026 — part 1/2', @mid_ryan,   @cashflow_id),
  (100,'EUR','VALIDATED','2026-04-05','Cotisation Avril 2026 — part 2/2', @mid_ryan,   @cashflow_id),
  (100,'EUR','VALIDATED','2026-04-05','Cotisation Avril 2026 — part 1/2', @mid_albert, @cashflow_id),
  (100,'EUR','VALIDATED','2026-04-05','Cotisation Avril 2026 — part 2/2', @mid_albert, @cashflow_id);

-- ─── 5c. Fond jan–avr (10 € × parts, reasons = buildFondReason du TS) ─
INSERT INTO `deposit` (`amount`, `currency`, `status`, `creationDate`, `reasons`, `authorId`, `cashFlowId`) VALUES
  (20,'EUR','VALIDATED','2026-01-05','Fond Janvier 2026 (2 parts × 10 €)',@mid_ronaldo,@cashflow_id),
  (20,'EUR','VALIDATED','2026-01-05','Fond Janvier 2026 (2 parts × 10 €)',@mid_patrick,@cashflow_id),
  (20,'EUR','VALIDATED','2026-01-05','Fond Janvier 2026 (2 parts × 10 €)',@mid_steve,  @cashflow_id),
  (10,'EUR','VALIDATED','2026-01-05','Fond Janvier 2026',                 @mid_romeo,  @cashflow_id),
  (10,'EUR','VALIDATED','2026-01-05','Fond Janvier 2026',                 @mid_paola,  @cashflow_id),
  (20,'EUR','VALIDATED','2026-01-05','Fond Janvier 2026 (2 parts × 10 €)',@mid_ryan,   @cashflow_id),
  (20,'EUR','VALIDATED','2026-01-05','Fond Janvier 2026 (2 parts × 10 €)',@mid_albert, @cashflow_id),
  (20,'EUR','VALIDATED','2026-02-05','Fond Février 2026 (2 parts × 10 €)',@mid_ronaldo,@cashflow_id),
  (20,'EUR','VALIDATED','2026-02-05','Fond Février 2026 (2 parts × 10 €)',@mid_patrick,@cashflow_id),
  (20,'EUR','VALIDATED','2026-02-05','Fond Février 2026 (2 parts × 10 €)',@mid_steve,  @cashflow_id),
  (10,'EUR','VALIDATED','2026-02-05','Fond Février 2026',                 @mid_romeo,  @cashflow_id),
  (10,'EUR','VALIDATED','2026-02-05','Fond Février 2026',                 @mid_paola,  @cashflow_id),
  (20,'EUR','VALIDATED','2026-02-05','Fond Février 2026 (2 parts × 10 €)',@mid_ryan,   @cashflow_id),
  (20,'EUR','VALIDATED','2026-02-05','Fond Février 2026 (2 parts × 10 €)',@mid_albert, @cashflow_id),
  (20,'EUR','VALIDATED','2026-03-05','Fond Mars 2026 (2 parts × 10 €)',   @mid_ronaldo,@cashflow_id),
  (20,'EUR','VALIDATED','2026-03-05','Fond Mars 2026 (2 parts × 10 €)',   @mid_patrick,@cashflow_id),
  (20,'EUR','VALIDATED','2026-03-05','Fond Mars 2026 (2 parts × 10 €)',   @mid_steve,  @cashflow_id),
  (10,'EUR','VALIDATED','2026-03-05','Fond Mars 2026',                    @mid_romeo,  @cashflow_id),
  (10,'EUR','VALIDATED','2026-03-05','Fond Mars 2026',                    @mid_paola,  @cashflow_id),
  (20,'EUR','VALIDATED','2026-03-05','Fond Mars 2026 (2 parts × 10 €)',   @mid_ryan,   @cashflow_id),
  (20,'EUR','VALIDATED','2026-03-05','Fond Mars 2026 (2 parts × 10 €)',   @mid_albert, @cashflow_id),
  (20,'EUR','VALIDATED','2026-04-05','Fond Avril 2026 (2 parts × 10 €)',  @mid_ronaldo,@cashflow_id),
  (20,'EUR','VALIDATED','2026-04-05','Fond Avril 2026 (2 parts × 10 €)',  @mid_patrick,@cashflow_id),
  (20,'EUR','VALIDATED','2026-04-05','Fond Avril 2026 (2 parts × 10 €)',  @mid_steve,  @cashflow_id),
  (10,'EUR','VALIDATED','2026-04-05','Fond Avril 2026',                   @mid_romeo,  @cashflow_id),
  (10,'EUR','VALIDATED','2026-04-05','Fond Avril 2026',                   @mid_paola,  @cashflow_id),
  (20,'EUR','VALIDATED','2026-04-05','Fond Avril 2026 (2 parts × 10 €)',  @mid_ryan,   @cashflow_id),
  (20,'EUR','VALIDATED','2026-04-05','Fond Avril 2026 (2 parts × 10 €)',  @mid_albert, @cashflow_id);

SET FOREIGN_KEY_CHECKS = 1;

SELECT CONCAT('OK — tontine id=', @tontine_id, ' | cash_flow.amount=', (SELECT amount FROM cash_flow WHERE id = @cashflow_id)) AS result;

SELECT CONCAT('Reports : ', IFNULL(ROUND(SUM(amount), 2), 0), ' EUR') AS sum_reports
FROM deposit WHERE cashFlowId = @cashflow_id AND reasons LIKE 'Report solde%';

SELECT CONCAT('Cotisations : ', IFNULL(ROUND(SUM(amount), 2), 0), ' EUR') AS sum_cotis
FROM deposit WHERE cashFlowId = @cashflow_id AND reasons LIKE 'Cotisation%';

SELECT CONCAT('Fond : ', IFNULL(ROUND(SUM(amount), 2), 0), ' EUR') AS sum_fond
FROM deposit WHERE cashFlowId = @cashflow_id AND reasons LIKE 'Fond%';
