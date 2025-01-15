import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthentificationModule } from './authentification/authentification.module';
import { MemberModule } from './member/member.module';
import { TontineModule } from './tontine/tontine.module';
import { JwtModule } from '@nestjs/jwt';
import { environment } from './shared/environement';
import { LoanModule } from './loan/loan.module';
import { EventModule } from './event/event.module';
import { RolesGuard } from './authentification/entities/roles/roles.guard';
import { APP_GUARD } from '@nestjs/core';
import { PassportModule } from '@nestjs/passport';
import { NotificationModule } from './notification/notification.module';

@Module({
  imports: [
    JwtModule.register({
      global: environment.jwtConfig.global,
      secret: environment.jwtConfig.secret,
      signOptions: { expiresIn: environment.jwtConfig.expiresIn },
    }),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: 'root',
      database: 'tontine',
      synchronize: true,
      autoLoadEntities: true,
    }),
    MemberModule,
    AuthentificationModule,
    TontineModule,
    LoanModule,
    EventModule,
    NotificationModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
