import { config as loadEnv } from 'dotenv';
import { DataSource } from 'typeorm';
import { User } from '../authentification/entities/user.entity';
import { Event } from '../event/entities/event.entity';
import { Loan } from '../loan/entities/loan.entity';
import { Member } from '../member/entities/member.entity';
import { Notification } from '../notification/entities/notification.entity';
import { CashFlow } from '../tontine/entities/cashflow.entity';
import { ConfigTontine } from '../tontine/entities/config-tontine.entity';
import { Deposit } from '../tontine/entities/deposit.entity';
import { MemberRole } from '../tontine/entities/member-role.entity';
import { PartOrder } from '../tontine/entities/part-order.entity';
import { RapportMeeting } from '../tontine/entities/rapport-meeting.entity';
import { RateMap } from '../tontine/entities/rate-map.entity';
import { Sanction } from '../tontine/entities/sanction.entity';
import { Tontine } from '../tontine/entities/tontine.entity';

loadEnv({ quiet: true });

const entities = [
  User,
  Member,
  Tontine,
  ConfigTontine,
  CashFlow,
  Deposit,
  Sanction,
  RapportMeeting,
  MemberRole,
  Loan,
  Event,
  Notification,
  PartOrder,
  RateMap,
];

export default new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  username: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_DATABASE || 'tontine',
  entities,
  migrations: [`${__dirname}/migrations/*{.ts,.js}`],
  synchronize: false,
});
