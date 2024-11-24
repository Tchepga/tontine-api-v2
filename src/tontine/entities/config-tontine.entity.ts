import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'config_tontine' })
export class ConfigTontine {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: 0 })
  defaultLoanRate: number;

  @Column({ nullable: true })
  defaultLoanDuration: number;

  @Column({ default: 'MONTHLY' })
  loopPeriod: 'DAILY' | 'WEEKLY' | 'MONTHLY';

  @Column({ default: 0 })
  minLoanAmount: number;

  @Column({ default: 1 })
  countPersonPerMovement: number;

  @Column({ default: 'ROTATIVE' })
  movementType: 'ROTATIVE' | 'CUMULATIVE';

  @Column({ default: 12 })
  countMaxMember: number;
}
