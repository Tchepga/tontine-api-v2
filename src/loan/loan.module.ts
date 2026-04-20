import { Module } from '@nestjs/common';
import { LoanService } from './loan.service';
import { LoanController } from './loan.controller';
import { MemberModule } from '../member/member.module';
import { Member } from '../member/entities/member.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../authentification/entities/user.entity';
import { Loan } from './entities/loan.entity';
import { LoanRepayment } from './entities/loan-repayment.entity';
import { CashFlow } from '../tontine/entities/cashflow.entity';
import { ConfigTontine } from '../tontine/entities/config-tontine.entity';
import { MemberRole } from '../tontine/entities/member-role.entity';
import { Tontine } from '../tontine/entities/tontine.entity';
import { TontineService } from '../tontine/tontine.service';
import { MemberService } from '../member/member.service';
import { AuthentificationService } from '../authentification/authentification.service';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Member, User, Loan, Tontine, LoanRepayment, CashFlow, ConfigTontine, MemberRole]),
    MemberModule,
    NotificationModule,
  ],
  controllers: [LoanController],
  providers: [
    LoanService,
    TontineService,
    MemberService,
    AuthentificationService,
  ],
})
export class LoanModule {}
