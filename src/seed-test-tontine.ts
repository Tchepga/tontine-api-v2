/**
 * Seed : tontine de test « Les Amicales 2026 »
 * — 7 membres, 12 ordres de passage, 4 mois de cotisations + fond (proportionnel aux parts)
 *
 * Usage :
 *   npx ts-node -r tsconfig-paths/register src/seed-test-tontine.ts
 *
 * Ordre de passage 2026 (aligné sur PART_ORDERS) :
 *   Jan:Ronaldo Fév:Patrick Mar:Steve   Avr:Ronaldo
 *   Mai:Steve   Juin:Patrick Jul:Romeo Aoû:Paola
 *   Sep:Ryan    Oct:Albert  Nov:Albert Déc:Ryan
 */

import 'dotenv/config';
import * as bcrypt from 'bcrypt';
import { DataSource } from 'typeorm';
import { User } from './authentification/entities/user.entity';
import { Member } from './member/entities/member.entity';
import { Tontine } from './tontine/entities/tontine.entity';
import { CashFlow } from './tontine/entities/cashflow.entity';
import { ConfigTontine } from './tontine/entities/config-tontine.entity';
import { MemberRole } from './tontine/entities/member-role.entity';
import { PartOrder } from './tontine/entities/part-order.entity';
import { Deposit } from './tontine/entities/deposit.entity';
import { Role } from './authentification/entities/roles/roles.enum';
import { SystemType } from './tontine/enum/system-type';
import { StatusDeposit } from './tontine/enum/status-deposit';

const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  username: process.env.DB_USERNAME || 'tontine',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_DATABASE || 'tontine',
  synchronize: false,
  logging: false,
  entities: [
    User,
    Member,
    Tontine,
    CashFlow,
    ConfigTontine,
    MemberRole,
    PartOrder,
    Deposit,
    __dirname + '/tontine/entities/*.entity{.ts,.js}',
    __dirname + '/member/entities/*.entity{.ts,.js}',
    __dirname + '/authentification/entities/*.entity{.ts,.js}',
    __dirname + '/loan/entities/*.entity{.ts,.js}',
    __dirname + '/notification/entities/*.entity{.ts,.js}',
    __dirname + '/event/entities/*.entity{.ts,.js}',
  ],
});

/** Rôle dans la tontine (MemberRole) ; le User garde TONTINARD pour l’auth globale */
const MEMBERS_DATA = [
  { username: 'ronaldo', firstname: 'Ronaldo', lastname: 'Silva', role: Role.PRESIDENT },
  { username: 'patrick', firstname: 'Patrick', lastname: 'Tchepga', role: Role.ACCOUNT_MANAGER },
  { username: 'steve', firstname: 'Steve', lastname: 'XXXXX', role: Role.TONTINARD },
  { username: 'romeo', firstname: 'Romeo', lastname: 'XXXXX', role: Role.TONTINARD },
  { username: 'paola', firstname: 'Paola', lastname: 'XXXXX', role: Role.TONTINARD },
  { username: 'ryan', firstname: 'Ryan', lastname: 'XXXXX', role: Role.TONTINARD },
  { username: 'albert', firstname: 'Albert', lastname: 'Kamga', role: Role.TONTINARD },
];

const PART_ORDERS = [
  { username: 'ronaldo', month: 1, order: 1 },
  { username: 'patrick', month: 2, order: 2 },
  { username: 'steve', month: 3, order: 3 },
  { username: 'ronaldo', month: 4, order: 4 },
  { username: 'steve', month: 5, order: 5 },
  { username: 'patrick', month: 6, order: 6 },
  { username: 'romeo', month: 7, order: 7 },
  { username: 'paola', month: 8, order: 8 },
  { username: 'ryan', month: 9, order: 9 },
  { username: 'albert', month: 10, order: 10 },
  { username: 'albert', month: 11, order: 11 },
  { username: 'ryan', month: 12, order: 12 },
];

const PARTS_PER_MEMBER: Record<string, number> = {
  ronaldo: 2,
  patrick: 2,
  steve: 2,
  romeo: 1,
  paola: 1,
  ryan: 2,
  albert: 2,
};

const PART_AMOUNT = 100;
const PAID_MONTHS = [1, 2, 3, 4];

const CARRY_OVER: { username: string; amount: number }[] = [
  { username: 'albert', amount: 554.31 },
  { username: 'patrick', amount: 554.31 },
  { username: 'paola', amount: 487.31 },
  { username: 'romeo', amount: 344.54 },
  { username: 'ryan', amount: 334.77 },
];

const TONTINE_YEAR = 2026;
const DEFAULT_PASSWORD = 'Tontine2026!';
const CURRENCY = 'EUR';

const MONTHLY_TOTAL = Object.values(PARTS_PER_MEMBER).reduce((s, p) => s + p * PART_AMOUNT, 0);
const FOND_PER_PART = 10;
const FOND_PER_MONTH = Object.values(PARTS_PER_MEMBER).reduce((s, p) => s + p * FOND_PER_PART, 0);

const monthNames = [
  'Janvier',
  'Février',
  'Mars',
  'Avril',
  'Mai',
  'Juin',
  'Juillet',
  'Août',
  'Septembre',
  'Octobre',
  'Novembre',
  'Décembre',
];

function buildCotisationReason(month: number, partIndex: number, parts: number): string {
  const m = monthNames[month - 1];
  if (parts > 1) {
    return `Cotisation ${m} ${TONTINE_YEAR} — part ${partIndex}/${parts}`;
  }
  return `Cotisation ${m} ${TONTINE_YEAR}`;
}

function buildFondReason(month: number, parts: number): string {
  const m = monthNames[month - 1];
  if (parts > 1) {
    return `Fond ${m} ${TONTINE_YEAR} (${parts} parts × ${FOND_PER_PART} €)`;
  }
  return `Fond ${m} ${TONTINE_YEAR}`;
}

async function seed() {
  console.log('Connexion à la base…');
  await AppDataSource.initialize();
  console.log('Connecté.\n');

  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    console.log('Création utilisateurs + membres…');
    const memberMap = new Map<string, Member>();
    let phoneIdx = 1;

    for (const data of MEMBERS_DATA) {
      let user = await AppDataSource.getRepository(User).findOne({
        where: { username: data.username },
      });

      if (!user) {
        user = new User();
        user.username = data.username;
        user.password = await bcrypt.hash(DEFAULT_PASSWORD, 10);
        user.roles = [Role.TONTINARD];
        user = await queryRunner.manager.save(user);
        console.log(`  + user ${data.username}`);
      } else {
        console.log(`  = user ${data.username} (existant)`);
      }

      let member = await AppDataSource.getRepository(Member).findOne({
        where: { user: { username: data.username } },
        relations: ['user'],
      });

      if (!member) {
        member = new Member();
        member.firstname = data.firstname;
        member.lastname = data.lastname;
        member.email = null;
        member.phone = `+3360000000${phoneIdx}`;
        phoneIdx += 1;
        member.country = 'France';
        member.avatar = '';
        member.user = user;
        member = await queryRunner.manager.save(member);
        console.log(`  + membre ${data.firstname}`);
      } else {
        console.log(`  = membre ${data.firstname} (existant)`);
      }

      memberMap.set(data.username, member);
    }

    console.log('\nConfiguration tontine…');
    const config = new ConfigTontine();
    config.loopPeriod = 'MONTHLY';
    config.countMaxMember = 7;
    config.movementType = 'ROTATIVE';
    config.countPersonPerMovement = 1;
    config.defaultLoanRate = 5;
    config.defaultLoanDuration = 30;
    config.minLoanAmount = 100;
    config.systemType = SystemType.PART;
    const savedConfig = await queryRunner.manager.save(config);

    const carryOverTotal = CARRY_OVER.reduce((sum, c) => sum + c.amount, 0);
    const depositsTotal = PAID_MONTHS.length * MONTHLY_TOTAL;
    const distributedTotal = (PAID_MONTHS.length - 1) * MONTHLY_TOTAL;
    const currentBalance = parseFloat(
      (carryOverTotal + depositsTotal - distributedTotal).toFixed(2),
    );
    const fondTotal = PAID_MONTHS.length * FOND_PER_MONTH;

    console.log('\nCashflow (pot rotation uniquement — pas de colonne fondBalance sur l’entité)…');
    const cashflow = new CashFlow();
    cashflow.currency = CURRENCY;
    cashflow.dividendes = 0;
    cashflow.amount = currentBalance;
    const savedCashflow = await queryRunner.manager.save(cashflow);
    console.log(
      `  Pot rotation : ${currentBalance} ${CURRENCY} | Fond logique (somme dépôts) : ${fondTotal} ${CURRENCY}`,
    );

    console.log('\nTontine…');
    const tontine = new Tontine();
    tontine.title = 'Les Amicales 2026';
    tontine.legacy = 'Cotisation 100 € / part — 7 membres — rotation 2026';
    tontine.config = savedConfig;
    tontine.cashFlow = savedCashflow;
    tontine.members = Array.from(memberMap.values());
    const savedTontine = await queryRunner.manager.save(tontine);
    console.log(`  Tontine id=${savedTontine.id}`);

    console.log('\nRôles (member_role)…');
    for (const data of MEMBERS_DATA) {
      const member = memberMap.get(data.username);
      const memberRole = new MemberRole();
      memberRole.role = data.role;
      memberRole.user = member.user;
      memberRole.tontine = savedTontine;
      await queryRunner.manager.save(memberRole);
      console.log(`  ${data.username} → ${data.role}`);
    }

    console.log('\nOrdres de passage…');
    for (const partData of PART_ORDERS) {
      const member = memberMap.get(partData.username);
      const period = new Date(TONTINE_YEAR, partData.month - 1, 1);
      const partOrder = new PartOrder();
      partOrder.member = member;
      partOrder.order = partData.order;
      partOrder.period = period;
      partOrder.config = savedConfig;
      await queryRunner.manager.save(partOrder);
      console.log(`  ${monthNames[partData.month - 1].padEnd(12)} → ${member.firstname}`);
    }

    console.log('\nReports 2025…');
    for (const carry of CARRY_OVER) {
      const member = memberMap.get(carry.username);
      const deposit = new Deposit();
      deposit.amount = carry.amount;
      deposit.currency = CURRENCY;
      deposit.status = StatusDeposit.APPROVED;
      deposit.reasons = `Report solde 2025 — ${member.firstname}`;
      deposit.author = member;
      deposit.cashFlow = savedCashflow;
      deposit.creationDate = new Date('2025-12-31');
      await queryRunner.manager.save(deposit);
      console.log(`  ${member.firstname}: ${carry.amount} ${CURRENCY}`);
    }

    console.log('\nCotisations (jan–avr)…');
    let totalDeposits = 0;
    for (const month of PAID_MONTHS) {
      const depositDate = new Date(TONTINE_YEAR, month - 1, 5);
      let monthTotal = 0;
      for (const data of MEMBERS_DATA) {
        const member = memberMap.get(data.username);
        const parts = PARTS_PER_MEMBER[data.username] ?? 1;
        for (let p = 1; p <= parts; p++) {
          const deposit = new Deposit();
          deposit.amount = PART_AMOUNT;
          deposit.currency = CURRENCY;
          deposit.status = StatusDeposit.APPROVED;
          deposit.reasons = buildCotisationReason(month, p, parts);
          deposit.author = member;
          deposit.cashFlow = savedCashflow;
          deposit.creationDate = depositDate;
          await queryRunner.manager.save(deposit);
          totalDeposits += PART_AMOUNT;
          monthTotal += PART_AMOUNT;
        }
      }
      console.log(`  ${monthNames[month - 1]}: ${monthTotal} ${CURRENCY}`);
    }
    console.log(`  Total cotisations : ${totalDeposits} ${CURRENCY}`);

    console.log('\nFond (jan–avr, 10 € × parts — distingué via reasons préfixe Fond)…');
    let totalFond = 0;
    for (const month of PAID_MONTHS) {
      const fondDate = new Date(TONTINE_YEAR, month - 1, 5);
      let monthFond = 0;
      for (const data of MEMBERS_DATA) {
        const member = memberMap.get(data.username);
        const parts = PARTS_PER_MEMBER[data.username] ?? 1;
        const amount = FOND_PER_PART * parts;
        const deposit = new Deposit();
        deposit.amount = amount;
        deposit.currency = CURRENCY;
        deposit.status = StatusDeposit.APPROVED;
        deposit.reasons = buildFondReason(month, parts);
        deposit.author = member;
        deposit.cashFlow = savedCashflow;
        deposit.creationDate = fondDate;
        await queryRunner.manager.save(deposit);
        totalFond += amount;
        monthFond += amount;
      }
      console.log(`  ${monthNames[month - 1]}: ${monthFond} ${CURRENCY}`);
    }
    console.log(`  Total fond : ${totalFond} ${CURRENCY}`);

    await queryRunner.commitTransaction();

    console.log('\n' + '═'.repeat(60));
    console.log('SEED TERMINÉ');
    console.log('═'.repeat(60));
    console.log(`Tontine : ${savedTontine.title} (id ${savedTontine.id})`);
    console.log(`Mot de passe : ${DEFAULT_PASSWORD}`);
    console.log(`Pot cashflow.amount : ${cashflow.amount} ${CURRENCY}`);
    console.log(
      `(${carryOverTotal} report + ${depositsTotal} cotisations − ${distributedTotal} pots)`,
    );
  } catch (err) {
    await queryRunner.rollbackTransaction();
    const msg = err instanceof Error ? err.message : String(err);
    console.error('\nERREUR :', msg);
    throw err;
  } finally {
    await queryRunner.release();
    await AppDataSource.destroy();
  }
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
