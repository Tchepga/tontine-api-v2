import { Module } from '@nestjs/common';
import { SharedModule } from '../shared/shared.module';
import { AuthentificationController } from './authentification.controller';
import { AuthentificationService } from './authentification.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { RolesGuard } from './entities/roles/roles.guard';
import { NotificationModule } from '../notification/notification.module';
import { TontineModule } from '../tontine/tontine.module';

@Module({
  controllers: [AuthentificationController],
  imports: [
    SharedModule,
    TypeOrmModule.forFeature([User]),
    NotificationModule,
    TontineModule,
  ],
  providers: [AuthentificationService, RolesGuard],
  exports: [AuthentificationService, RolesGuard],
})
export class AuthentificationModule {}
