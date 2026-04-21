import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { RateMap } from './rate-map.entity';
import { SystemType } from '../enum/system-type';
import { PartOrder } from './part-order.entity';

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

  @Column({ type: 'enum', enum: SystemType, default: SystemType.AUCTION })
  systemType: SystemType;

  @Column({ type: 'boolean', default: false })
  reminderMissingDepositsEnabled: boolean;

  /**
   * Seuil (en %) de votes favorables requis pour approuver automatiquement
   * un prêt. Ex : 51 = majorité simple. 0 = approbation directe par le président.
   */
  @Column({ default: 51 })
  loanApprovalThreshold: number;

  /** Montant maximum autorisé pour un prêt */
  @Column({ nullable: true, default: null })
  maxLoanAmount: number;

  /**
   * Montant prélevé par participant chaque mois pour alimenter le fond de la tontine.
   * null = pas de fond dans cette tontine.
   * Ex : 10 = 10 € par membre et par mois vont en réserve (non redistribués en rotation).
   */
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, default: null })
  monthlyFondAmount: number | null;

  @OneToMany(() => RateMap, (rateMap) => rateMap.configTontine, {
    cascade: true,
  })
  rateMaps: RateMap[];

  @OneToMany(() => PartOrder, (partOrder) => partOrder.config, {
    eager: true,
    cascade: true,
  })
  partOrders: PartOrder[];
}
