import { Module } from '@nestjs/common';
import { SharedModule } from 'src/shared/shared.module';
import { AuthentificationController } from './authentification.controller';
import { AuthentificationService } from './authentification.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { RolesGuard } from './entities/roles/roles.guard';
import { TontineService } from 'src/tontine/tontine.service';
import { MemberService } from 'src/member/member.service';

@Module({
  controllers: [AuthentificationController],
  imports: [SharedModule, TypeOrmModule.forFeature([User])],
  providers: [
    AuthentificationService,
    RolesGuard,
    TontineService,
    MemberService,
  ],
  exports: [AuthentificationService, RolesGuard],
})
export class AuthentificationModule { }
