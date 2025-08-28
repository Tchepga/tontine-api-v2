import { Module } from '@nestjs/common';
import { SharedModule } from '../shared/shared.module';
import { AuthentificationController } from './authentification.controller';
import { AuthentificationService } from './authentification.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { RolesGuard } from './entities/roles/roles.guard';
import { TontineService } from '../tontine/tontine.service';
import { MemberService } from '../member/member.service';
import { NotificationService } from '../notification/notification.service';

@Module({
  controllers: [AuthentificationController],
  imports: [SharedModule, TypeOrmModule.forFeature([User])],
  providers: [
    AuthentificationService,
    RolesGuard,
    TontineService,
    MemberService,
    NotificationService,
  ],
  exports: [AuthentificationService, RolesGuard],
})
export class AuthentificationModule {}
