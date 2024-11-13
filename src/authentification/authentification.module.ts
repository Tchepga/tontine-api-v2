import { Module } from '@nestjs/common';
import { SharedModule } from 'src/shared/shared.module';
import { AuthentificationController } from './authentification.controller';
import { AuthentificationService } from './authentification.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { RolesGuard } from './roles.guard';

@Module({
  controllers: [AuthentificationController],
  imports: [SharedModule, TypeOrmModule.forFeature([User])],
  providers: [AuthentificationService, RolesGuard],
  exports: [AuthentificationService, RolesGuard],
})
export class AuthentificationModule {}
