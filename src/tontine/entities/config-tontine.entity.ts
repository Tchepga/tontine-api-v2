import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { RateMap } from './rate-map.entity';

@Entity({ name: 'config_tontine' })
export class ConfigTontine {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: 1 })
  defaultLoanRate: number;

  @Column({ nullable: true, default: 30 })
  defaultLoanDuration: number;

  @Column({ default: 'MONTHLY' })
  loopPeriod: 'DAILY' | 'WEEKLY' | 'MONTHLY';

  @Column({ default: 100 })
  minLoanAmount: number;

  @Column({ default: 1 })
  countPersonPerMovement: number;

  @Column({ default: 'ROTATIVE' })
  movementType: 'ROTATIVE' | 'CUMULATIVE';

  @Column({ default: 12 })
  countMaxMember: number;

  @OneToMany(() => RateMap, (rateMap) => rateMap.configTontine, {
    cascade: true,
  })
  rateMaps: RateMap[];
}
