/**
 * Script de seed : crée une tontine de test avec 7 membres et 12 ordres de passage.
 *
 * Usage :
 *   npx ts-node -r tsconfig-paths/register src/seed-test-tontine.ts
 *
 * Ordre de passage :
 *   Janvier : Ronaldo | Février : Patrick | Mars : Steve  | Avril : Ronaldo
 *   Mai     : Steve   | Juin    : Patrick | Juillet: Romeo | Août   : Paola
 *   Sept.   : Ryan    | Octobre : Albert  | Nov.   : Albert| Déc.   : Ryan
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
import { Role } from './authentification/entities/roles/roles.enum';
import { SystemType } from './tontine/enum/system-type';

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
    User, Member, Tontine, CashFlow, ConfigTontine, MemberRole, PartOrder,
    // Autres entités nécessaires pour TypeORM
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
  { username: 'ronaldo',  firstname: 'Ronaldo',  lastname: 'Silva',   role: Role.TONTINARD },
  { username: 'patrick',  firstname: 'Patrick',  lastname: 'Tchepga', role: Role.TONTINARD },
  { username: 'steve',    firstname: 'Steve',    lastname: 'Martin',  role: Role.TONTINARD },
  { username: 'romeo',    firstname: 'Romeo',    lastname: 'Fontaine',role: Role.TONTINARD },
  { username: 'paola',    firstname: 'Paola',    lastname: 'Dupont',  role: Role.TONTINARD },
  { username: 'ryan',     firstname: 'Ryan',     lastname: 'Bernard', role: Role.TONTINARD },
  { username: 'albert',   firstname: 'Albert',   lastname: 'Kamga',   role: Role.PRESIDENT },
];

// ─── Ordre de passage (12 mois) ───────────────────────────────────────────────
// username => mois (1-12) où ce membre passe
const PART_ORDERS = [
  { username: 'ronaldo', month: 1,  order: 1  },
  { username: 'patrick', month: 2,  order: 2  },
  { username: 'steve',   month: 3,  order: 3  },
  { username: 'ronaldo', month: 4,  order: 4  },
  { username: 'steve',   month: 5,  order: 5  },
  { username: 'patrick', month: 6,  order: 6  },
  { username: 'romeo',   month: 7,  order: 7  },
  { username: 'paola',   month: 8,  order: 8  },
  { username: 'ryan',    month: 9,  order: 9  },
  { username: 'albert',  month: 10, order: 10 },
  { username: 'albert',  month: 11, order: 11 },
  { username: 'ryan',    month: 12, order: 12 },
];

const TONTINE_YEAR = 2025;
const DEFAULT_PASSWORD = 'Tontine2025!';

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
      // Vérifier si l'utilisateur existe déjà
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
        member.lastname = data.lastname;
        member.email = null;
        member.phone = '+237600000000';
        member.country = 'Cameroun';
        member.user = user;
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
    config.loopPeriod = 'MONTHLY';
    config.countMaxMember = 7;
    config.movementType = 'ROTATIVE';
    config.countPersonPerMovement = 1;
    config.defaultLoanRate = 5;
    config.defaultLoanDuration = 30;
    config.minLoanAmount = 10000;
    config.systemType = SystemType.PART;
    config.loanApprovalThreshold = 51;
    config.reminderMissingDepositsEnabled = true;
    const savedConfig = await queryRunner.manager.save(config);
    console.log('  ✓ Config créée');

    // 3. Créer le cashflow
    console.log('\n💰 Création du cashflow...');
    const cashflow = new CashFlow();
    cashflow.amount = 0;
    cashflow.currency = 'FCFA';
    cashflow.dividendes = 0;
    const savedCashflow = await queryRunner.manager.save(cashflow);
    console.log('  ✓ Cashflow créé');

    // 4. Créer la tontine
    console.log('\n🏦 Création de la tontine...');
    const tontine = new Tontine();
    tontine.title = 'Tontine des Amis 2025';
    tontine.legacy = 'Tontine de test — cotisation mensuelle FCFA';
    tontine.config = savedConfig;
    tontine.cashFlow = savedCashflow;
    tontine.members = Array.from(memberMap.values());
    const savedTontine = await queryRunner.manager.save(tontine);
    console.log(`  ✓ Tontine créée (ID: ${savedTontine.id})`);

    // 5. Créer les rôles par tontine
    console.log('\n🎭 Assignation des rôles...');
    for (const data of MEMBERS_DATA) {
      const member = memberMap.get(data.username);
      const user = member.user;

      const memberRole = new MemberRole();
      memberRole.role = data.role;
      memberRole.user = user;
      memberRole.tontine = savedTontine;
      await queryRunner.manager.save(memberRole);
      console.log(`  ✓ ${data.username} → ${data.role}`);
    }

    // 6. Créer les ordres de passage (12 mois)
    console.log('\n📅 Création des ordres de passage...');
    for (const partData of PART_ORDERS) {
      const member = memberMap.get(partData.username);
      const period = new Date(TONTINE_YEAR, partData.month - 1, 1); // 1er du mois

      const partOrder = new PartOrder();
      partOrder.member = member;
      partOrder.order = partData.order;
      partOrder.period = period;
      partOrder.config = savedConfig;
      await queryRunner.manager.save(partOrder);

      const monthNames = [
        'Janvier','Février','Mars','Avril','Mai','Juin',
        'Juillet','Août','Septembre','Octobre','Novembre','Décembre',
      ];
      console.log(`  ✓ ${monthNames[partData.month - 1].padEnd(10)} → ${member.firstname}`);
    }

    await queryRunner.commitTransaction();

    console.log('\n' + '═'.repeat(60));
    console.log('✅ SEED TERMINÉ AVEC SUCCÈS');
    console.log('═'.repeat(60));
    console.log(`\n🏦 Tontine ID : ${savedTontine.id}`);
    console.log(`📝 Titre      : ${savedTontine.title}`);
    console.log(`👥 Membres    : ${savedTontine.members.length}`);
    console.log(`\n🔑 Identifiants (mot de passe : ${DEFAULT_PASSWORD}) :`);
    for (const data of MEMBERS_DATA) {
      const roleLabel = data.role === Role.PRESIDENT ? ' [PRÉSIDENT]'
        : data.role === Role.ACCOUNT_MANAGER ? ' [TRÉSORIER]' : '';
      console.log(`   ${data.username.padEnd(10)} → ${DEFAULT_PASSWORD}${roleLabel}`);
    }
    console.log('\n📅 Ordre de passage :');
    const monthNames = [
      'Janvier','Février','Mars','Avril','Mai','Juin',
      'Juillet','Août','Septembre','Octobre','Novembre','Décembre',
    ];
    for (const p of PART_ORDERS) {
      const member = memberMap.get(p.username);
      console.log(`   ${monthNames[p.month - 1].padEnd(11)} → ${member.firstname}`);
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
