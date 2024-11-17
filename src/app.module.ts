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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
