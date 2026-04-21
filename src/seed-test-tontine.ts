/**
 * Script de seed : crée une tontine de test réaliste (2026)
 * avec 7 membres, 12 ordres de passage, et 4 mois de cotisations déjà validées.
 *
 * Usage :
 *   npx ts-node -r tsconfig-paths/register src/seed-test-tontine.ts
 *
 * Ordre de passage 2026 (à ajuster selon votre organisation) :
 *   Jan:Albert  Fév:Ryan     Mar:Paola   Avr:Ronaldo
 *   Mai:Patrick Juin:Steve   Jul:Romeo   Aoû:Albert
 *   Sep:Ryan    Oct:Paola    Nov:Ronaldo Déc:Patrick
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
import { DepositType } from './tontine/enum/deposit-type';

// ─── Configuration de la base de données ──────────────────────────────────────
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
    User, Member, Tontine, CashFlow, ConfigTontine, MemberRole, PartOrder, Deposit,
    __dirname + '/tontine/entities/*.entity{.ts,.js}',
    __dirname + '/member/entities/*.entity{.ts,.js}',
    __dirname + '/authentification/entities/*.entity{.ts,.js}',
    __dirname + '/loan/entities/*.entity{.ts,.js}',
    __dirname + '/notification/entities/*.entity{.ts,.js}',
    __dirname + '/event/entities/*.entity{.ts,.js}',
  ],
});

// ─── Données des membres ───────────────────────────────────────────────────────
const MEMBERS_DATA = [
  { username: 'ronaldo', firstname: 'Ronaldo', lastname: 'Silva',   role: Role.PRESIDENT },
  { username: 'patrick', firstname: 'Patrick', lastname: 'Tchepga', role: Role.ACCOUNT_MANAGER },
  { username: 'steve',   firstname: 'Steve',   lastname: 'XXXXX',   role: Role.TONTINARD },
  { username: 'romeo',   firstname: 'Romeo',   lastname: 'XXXXX',   role: Role.TONTINARD },
  { username: 'paola',   firstname: 'Paola',   lastname: 'XXXXX',   role: Role.TONTINARD },
  { username: 'ryan',    firstname: 'Ryan',    lastname: 'XXXXX',   role: Role.TONTINARD },
  { username: 'albert',  firstname: 'Albert',  lastname: 'Kamga',   role: Role.TONTINARD },
];

// ─── Ordre de passage 2026 (12 mois — certains membres ont 2 parts) ───────────
// Chaque part = 1 mois de bénéfice du pot + 1 cotisation supplémentaire/mois.
const PART_ORDERS = [
  { username: 'ronaldo', month: 1,  order: 1  }, // Janvier    : Ronaldo (part 1)  ✅ passé
  { username: 'patrick', month: 2,  order: 2  }, // Février    : Patrick (part 1)  ✅ passé
  { username: 'steve',   month: 3,  order: 3  }, // Mars       : Steve   (part 1)  ✅ passé
  { username: 'ronaldo', month: 4,  order: 4  }, // Avril      : Ronaldo (part 2)  ← en cours
  { username: 'steve',   month: 5,  order: 5  }, // Mai        : Steve   (part 2)
  { username: 'patrick', month: 6,  order: 6  }, // Juin       : Patrick (part 2)
  { username: 'romeo',   month: 7,  order: 7  }, // Juillet    : Romeo
  { username: 'paola',   month: 8,  order: 8  }, // Août       : Paola
  { username: 'ryan',    month: 9,  order: 9  }, // Septembre  : Ryan    (part 1)
  { username: 'albert',  month: 10, order: 10 }, // Octobre    : Albert  (part 1)
  { username: 'albert',  month: 11, order: 11 }, // Novembre   : Albert  (part 2)
  { username: 'ryan',    month: 12, order: 12 }, // Décembre   : Ryan    (part 2)
];

// ─── Parts par membre (détermine le montant de cotisation mensuelle) ──────────
// 100 € par part — membres avec 2 parts cotisent 200 €/mois
const PARTS_PER_MEMBER: Record<string, number> = {
  ronaldo: 2, // Jan + Avr
  patrick: 2, // Fév + Juin
  steve:   2, // Mar + Mai
  romeo:   1, // Juil
  paola:   1, // Août
  ryan:    2, // Sep + Déc
  albert:  2, // Oct + Nov
};
const PART_AMOUNT = 100; // 100 € par part

// ─── Cotisations passées (4 mois écoulés, tout le monde a payé) ───────────────
const PAID_MONTHS = [1, 2, 3, 4];
// Total/mois : 5×200 + 2×100 = 1 200 €

// Soldes reportés depuis l'année précédente (réunion 11/01/2026)
// Ronaldo et Steve : fonds retirés → pas de report.
const CARRY_OVER: { username: string; amount: number }[] = [
  { username: 'albert',  amount: 554.31 },
  { username: 'patrick', amount: 554.31 },
  { username: 'paola',   amount: 487.31 },
  { username: 'romeo',   amount: 344.54 },
  { username: 'ryan',    amount: 334.77 },
];

const TONTINE_YEAR     = 2026;
const DEFAULT_PASSWORD = 'Tontine2026!';
const CURRENCY         = 'EUR';

// Total mensuel = somme des parts × 100 €
const MONTHLY_TOTAL  = Object.values(PARTS_PER_MEMBER).reduce((s, p) => s + p * PART_AMOUNT, 0);
// = 5×200 + 2×100 = 1 200 €
const FOND_PER_PART  = 10; // 10 € par part → fond de la tontine
// Fond mensuel par membre = nb_parts × 10 €  (ex: 2 parts → 20 €, 1 part → 10 €)
// Total fond/mois = 5×20 + 2×10 = 120 €
const FOND_PER_MONTH = Object.values(PARTS_PER_MEMBER).reduce((s, p) => s + p * FOND_PER_PART, 0);

// ─── Script principal ──────────────────────────────────────────────────────────
async function seed() {
  console.log('🔌 Connexion à la base de données...');
  await AppDataSource.initialize();
  console.log('✅ Connecté.\n');

  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    // 1. Créer les utilisateurs et membres
    console.log('👥 Création des membres...');
    const memberMap = new Map<string, Member>();

    for (const data of MEMBERS_DATA) {
      let user = await AppDataSource.getRepository(User).findOne({
        where: { username: data.username },
      });

      if (!user) {
        user = new User();
        user.username = data.username;
        user.password = await bcrypt.hash(DEFAULT_PASSWORD, 10);
        user.roles = [data.role];
        user = await queryRunner.manager.save(user);
        console.log(`  ✓ Utilisateur créé : ${data.username}`);
      } else {
        console.log(`  ↩ Utilisateur existant : ${data.username}`);
      }

      let member = await AppDataSource.getRepository(Member).findOne({
        where: { user: { username: data.username } },
        relations: ['user'],
      });

      if (!member) {
        member = new Member();
        member.firstname = data.firstname;
        member.lastname  = data.lastname;
        member.email     = null;
        member.phone     = '+33600000000';
        member.country   = 'France';
        member.user      = user;
        member = await queryRunner.manager.save(member);
        console.log(`  ✓ Membre créé : ${data.firstname} ${data.lastname}`);
      } else {
        console.log(`  ↩ Membre existant : ${data.firstname} ${data.lastname}`);
      }

      memberMap.set(data.username, member);
    }

    // 2. Créer la configuration de la tontine
    console.log('\n⚙️  Création de la configuration...');
    const config = new ConfigTontine();
    config.loopPeriod               = 'MONTHLY';
    config.countMaxMember           = 7;
    config.movementType             = 'ROTATIVE';
    config.countPersonPerMovement   = 1;
    config.defaultLoanRate          = 5;
    config.defaultLoanDuration      = 30;
    config.minLoanAmount            = 100;  // 100 € = 1 part
    config.systemType               = SystemType.PART;
    config.loanApprovalThreshold    = 51;
    config.reminderMissingDepositsEnabled = true;
    config.monthlyFondAmount        = FOND_PER_PART; // 10 € par part par mois
    const savedConfig = await queryRunner.manager.save(config);
    console.log('  ✓ Config créée');

    // 3. Créer le cashflow
    // Rotation : report + 4×1200 - 3 pots (jan/fév/mar) = 2275.24 + 1200 = 3475.24 €
    // Fond     : 4 mois × 120 €/mois (proportionnel aux parts) = 480 €
    const carryOverTotal   = CARRY_OVER.reduce((sum, c) => sum + c.amount, 0);
    const depositsTotal    = PAID_MONTHS.length * MONTHLY_TOTAL;
    const distributedTotal = (PAID_MONTHS.length - 1) * MONTHLY_TOTAL;
    const currentBalance   = parseFloat((carryOverTotal + depositsTotal - distributedTotal).toFixed(2));
    const fondTotal        = PAID_MONTHS.length * FOND_PER_MONTH; // 4 × 120 = 480 €

    console.log('\n💰 Création du cashflow...');
    const cashflow = new CashFlow();
    cashflow.currency    = CURRENCY;
    cashflow.dividendes  = 0;
    cashflow.amount      = currentBalance;
    cashflow.fondBalance = fondTotal;
    const savedCashflow = await queryRunner.manager.save(cashflow);
    console.log(`  ✓ Pot rotation : ${currentBalance} ${CURRENCY} | Fond : ${fondTotal} ${CURRENCY}`);

    // 4. Créer la tontine
    console.log('\n🏦 Création de la tontine...');
    const tontine = new Tontine();
    tontine.title    = 'Les Amicales 2026';
    tontine.legacy   = 'Cotisation mensuelle 100 € — 7 membres — rotation annuelle';
    tontine.config   = savedConfig;
    tontine.cashFlow = savedCashflow;
    tontine.members  = Array.from(memberMap.values());
    const savedTontine = await queryRunner.manager.save(tontine);
    console.log(`  ✓ Tontine créée (ID: ${savedTontine.id})`);

    // 5. Assigner les rôles par tontine
    console.log('\n🎭 Assignation des rôles...');
    for (const data of MEMBERS_DATA) {
      const member     = memberMap.get(data.username);
      const memberRole = new MemberRole();
      memberRole.role   = data.role;
      memberRole.user   = member.user;
      memberRole.tontine = savedTontine;
      await queryRunner.manager.save(memberRole);
      console.log(`  ✓ ${data.username.padEnd(10)} → ${data.role}`);
    }

    // 6. Créer les ordres de passage (12 mois 2026)
    console.log('\n📅 Création des ordres de passage...');
    const monthNames = [
      'Janvier','Février','Mars','Avril','Mai','Juin',
      'Juillet','Août','Septembre','Octobre','Novembre','Décembre',
    ];
    for (const partData of PART_ORDERS) {
      const member   = memberMap.get(partData.username);
      const period   = new Date(TONTINE_YEAR, partData.month - 1, 1);
      const partOrder = new PartOrder();
      partOrder.member = member;
      partOrder.order  = partData.order;
      partOrder.period = period;
      partOrder.config = savedConfig;
      await queryRunner.manager.save(partOrder);
      console.log(`  ✓ ${monthNames[partData.month - 1].padEnd(12)} → ${member.firstname}`);
    }

    // 7a. Dépôts de report (soldes pré-existants au 31/12/2025)
    console.log('\n📦 Injection des soldes reportés (avant jan 2026)...');
    for (const carry of CARRY_OVER) {
      const member  = memberMap.get(carry.username);
      const deposit = new Deposit();
      deposit.amount       = carry.amount;
      deposit.currency     = CURRENCY;
      deposit.status       = StatusDeposit.APPROVED;
      deposit.reasons      = 'VERSEMENT';
      deposit.author       = member;
      deposit.cashFlow     = savedCashflow;
      deposit.creationDate = new Date('2025-12-31');
      deposit.comment      = `Report solde 2025 — ${member.firstname}`;
      await queryRunner.manager.save(deposit);
      console.log(`  ✓ Report ${member.firstname.padEnd(10)} : ${carry.amount} ${CURRENCY}`);
    }

    // 7b. Créer les cotisations des 4 mois écoulés (toutes VALIDÉES)
    // Chaque membre crée autant de dépôts que de parts (1 dépôt = 1 part = 100 €)
    console.log('\n💳 Création des cotisations (jan–avr 2026)...');
    let totalDeposits = 0;
    for (const month of PAID_MONTHS) {
      const depositDate = new Date(TONTINE_YEAR, month - 1, 5);
      let monthTotal = 0;
      for (const data of MEMBERS_DATA) {
        const member = memberMap.get(data.username);
        const parts  = PARTS_PER_MEMBER[data.username] ?? 1;
        for (let p = 1; p <= parts; p++) {
          const deposit = new Deposit();
          deposit.amount       = PART_AMOUNT;
          deposit.currency     = CURRENCY;
          deposit.status       = StatusDeposit.APPROVED;
          deposit.reasons      = 'VERSEMENT';
          deposit.author       = member;
          deposit.cashFlow     = savedCashflow;
          deposit.creationDate = depositDate;
          deposit.comment      = parts > 1
            ? `Cotisation ${monthNames[month - 1]} ${TONTINE_YEAR} — part ${p}/${parts}`
            : `Cotisation ${monthNames[month - 1]} ${TONTINE_YEAR}`;
          await queryRunner.manager.save(deposit);
          totalDeposits += PART_AMOUNT;
          monthTotal    += PART_AMOUNT;
        }
      }
      console.log(`  ✓ ${monthNames[month - 1].padEnd(9)} : ${monthTotal} ${CURRENCY} (${monthTotal / PART_AMOUNT} parts)`);
    }
    console.log(`  → Total injecté : ${totalDeposits} ${CURRENCY} sur ${PAID_MONTHS.length} mois`);

    // 7c. Contributions au fond — proportionnelles aux parts (10 € × nb_parts)
    // Membres 2 parts : 20 €/mois | Membres 1 part : 10 €/mois → 120 €/mois total
    console.log('\n🏦 Création des contributions au fond (jan–avr 2026)...');
    let totalFond = 0;
    for (const month of PAID_MONTHS) {
      const fondDate   = new Date(TONTINE_YEAR, month - 1, 5);
      let monthFond    = 0;
      for (const data of MEMBERS_DATA) {
        const member  = memberMap.get(data.username);
        const parts   = PARTS_PER_MEMBER[data.username] ?? 1;
        const amount  = FOND_PER_PART * parts; // 10€ × parts
        const deposit = new Deposit();
        deposit.amount       = amount;
        deposit.currency     = CURRENCY;
        deposit.status       = StatusDeposit.APPROVED;
        deposit.reasons      = 'VERSEMENT';
        deposit.type         = DepositType.FOND;
        deposit.author       = member;
        deposit.cashFlow     = savedCashflow;
        deposit.creationDate = fondDate;
        deposit.comment      = parts > 1
          ? `Fond ${monthNames[month - 1]} ${TONTINE_YEAR} (${parts} parts × ${FOND_PER_PART} €)`
          : `Fond ${monthNames[month - 1]} ${TONTINE_YEAR}`;
        await queryRunner.manager.save(deposit);
        totalFond += amount;
        monthFond += amount;
      }
      console.log(`  ✓ Fond ${monthNames[month - 1].padEnd(9)} : ${monthFond} ${CURRENCY}`);
    }
    console.log(`  → Total fond injecté : ${totalFond} ${CURRENCY}`);

    // 8. Mettre à jour selectedTontineId pour chaque membre
    for (const [, member] of memberMap) {
      member.selectedTontineId = savedTontine.id;
      await queryRunner.manager.save(member);
    }

    await queryRunner.commitTransaction();

    // ─── Résumé final ──────────────────────────────────────────────────────────
    console.log('\n' + '═'.repeat(60));
    console.log('✅ SEED TERMINÉ AVEC SUCCÈS');
    console.log('═'.repeat(60));
    console.log(`\n🏦 Tontine ID  : ${savedTontine.id}`);
    console.log(`📝 Titre       : ${savedTontine.title}`);
    console.log(`👥 Membres     : ${savedTontine.members.length}`);
    console.log(`💰 Cashflow    : ${cashflow.amount} ${CURRENCY} (solde mois courant)`);
    console.log(`\n🔑 Identifiants (mot de passe : ${DEFAULT_PASSWORD}) :`);
    for (const data of MEMBERS_DATA) {
      const roleLabel =
        data.role === Role.PRESIDENT        ? ' [PRÉSIDENT]'  :
        data.role === Role.ACCOUNT_MANAGER  ? ' [TRÉSORIER]'  :
        data.role === Role.SECRETARY        ? ' [SECRÉTAIRE]' : '';
      const carry = CARRY_OVER.find(c => c.username === data.username);
      const carryStr = carry ? ` | report: ${carry.amount} €` : '';
      console.log(`   ${data.username.padEnd(10)} → ${DEFAULT_PASSWORD}${roleLabel}${carryStr}`);
    }
    console.log(`\n💰 Pot rotation   : ${currentBalance} ${CURRENCY}`);
    console.log(`   (${carryOverTotal} report + ${depositsTotal} cotisations − ${distributedTotal} pots distribués)`);
    console.log(`🏦 Fond de réserve : ${fondTotal} ${CURRENCY} (${PAID_MONTHS.length} mois × ${FOND_PER_MONTH} €/mois, 10 € × parts par membre)`);
    console.log('\n📅 Ordre de passage 2026 :');
    for (const p of PART_ORDERS) {
      const member = memberMap.get(p.username);
      const tag    = p.month <= 4 ? ' ✅ passé' : '';
      console.log(`   ${monthNames[p.month - 1].padEnd(12)} → ${member.firstname}${tag}`);
    }

  } catch (err) {
    await queryRunner.rollbackTransaction();
    console.error('\n❌ ERREUR :', err.message);
    throw err;
  } finally {
    await queryRunner.release();
    await AppDataSource.destroy();
  }
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
