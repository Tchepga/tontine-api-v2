import { Module } from '@nestjs/common';
import { LoanService } from './loan.service';
import { LoanController } from './loan.controller';
import { MemberModule } from 'src/member/member.module';
import { Member } from 'src/member/entities/member.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/authentification/entities/user.entity';
import { Loan } from './entities/loan.entity';
import { Tontine } from 'src/tontine/entities/tontine.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Member, User, Loan, Tontine]),
    MemberModule,
  ],
  controllers: [LoanController],
  providers: [LoanService],
})
export class LoanModule {}
