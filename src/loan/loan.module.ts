import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthentificationService } from 'src/authentification/authentification.service';
import { User } from 'src/authentification/entities/user.entity';
import { MailModule } from 'src/mail/mail.module';
import { Member } from 'src/member/entities/member.entity';
import { MemberModule } from 'src/member/member.module';
import { MemberService } from 'src/member/member.service';
import { NotificationService } from 'src/notification/notification.service';
import { Tontine } from 'src/tontine/entities/tontine.entity';
import { TontineService } from 'src/tontine/tontine.service';
import { Loan } from './entities/loan.entity';
import { LoanController } from './loan.controller';
import { LoanService } from './loan.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Member, User, Loan, Tontine]),
    MemberModule,
    MailModule,
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
