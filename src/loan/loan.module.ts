import { Module } from '@nestjs/common';
import { LoanService } from './loan.service';
import { LoanController } from './loan.controller';
import { MemberModule } from '../member/member.module';
import { Member } from '../member/entities/member.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../authentification/entities/user.entity';
import { Loan } from './entities/loan.entity';
import { Tontine } from '../tontine/entities/tontine.entity';
import { TontineService } from '../tontine/tontine.service';
import { MemberService } from '../member/member.service';
import { AuthentificationService } from '../authentification/authentification.service';
import { NotificationService } from '../notification/notification.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Member, User, Loan, Tontine]),
    MemberModule,
  ],
  controllers: [LoanController],
  providers: [
    LoanService,
    TontineService,
    MemberService,
    AuthentificationService,
    NotificationService,
  ],
})
export class LoanModule {}
