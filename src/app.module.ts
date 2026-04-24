import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import type { StringValue } from 'ms';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthentificationModule } from './authentification/authentification.module';
import { RolesGuard } from './authentification/entities/roles/roles.guard';
import { EventModule } from './event/event.module';
import { LoanModule } from './loan/loan.module';
import { MemberModule } from './member/member.module';
import { NotificationModule } from './notification/notification.module';
import { environment } from './shared/config';
import { TontineModule } from './tontine/tontine.module';

@Module({
  imports: [
    JwtModule.register({
      global: environment.jwtConfig.global,
      secret: environment.jwtConfig.secret,
      signOptions: {
        expiresIn: environment.jwtConfig.expiresIn as StringValue,
      },
    }),
    TypeOrmModule.forRoot({
      type: environment.databaseConfig.type as any,
      host: environment.databaseConfig.host,
      port: environment.databaseConfig.port,
      username: environment.databaseConfig.username,
      password: environment.databaseConfig.password,
      database: environment.databaseConfig.database,
      synchronize: environment.databaseConfig.synchronize,
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
export class AppModule { }
