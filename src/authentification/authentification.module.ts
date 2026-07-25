import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MailModule } from 'src/mail/mail.module';
import { MemberService } from 'src/member/member.service';
import { NotificationService } from 'src/notification/notification.service';
import { SharedModule } from 'src/shared/shared.module';
import { TontineService } from 'src/tontine/tontine.service';
import { AuthentificationController } from './authentification.controller';
import { AuthentificationService } from './authentification.service';
import { RolesGuard } from './entities/roles/roles.guard';
import { User } from './entities/user.entity';

@Module({
  controllers: [AuthentificationController],
  imports: [SharedModule, TypeOrmModule.forFeature([User]), MailModule],
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
