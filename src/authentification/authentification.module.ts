import { Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SharedModule } from 'src/shared/shared.module';
import { AuthentificationController } from './authentification.controller';
import { User } from './entities/user.entity';
import { AuthentificationService } from './authentification.service';

@Module({
  controllers: [AuthentificationController],
  imports: [SharedModule, TypeOrmModule.forFeature([User])],
  providers: [AuthentificationService],
})
export class AuthentificationModule {}
