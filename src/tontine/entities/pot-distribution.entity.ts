import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Tontine } from './tontine.entity';
import { Member } from '../../member/entities/member.entity';

/**
 * Enregistre la distribution du pot (sans transfert d'argent réel,
 * uniquement le suivi comptable).
 */
@Entity({ name: 'pot_distribution' })
export class PotDistribution {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Tontine, { onDelete: 'CASCADE' })
  @JoinColumn()
  tontine: Tontine;

  /** Membre qui reçoit le pot ce cycle */
  @ManyToOne(() => Member, { eager: true })
  @JoinColumn()
  recipient: Member;

  /** Président ou gestionnaire qui enregistre la distribution */
  @ManyToOne(() => Member, { eager: true, nullable: true })
  @JoinColumn()
  distributedBy: Member;

  /** Montant distribué */
  @Column({ type: 'decimal', precision: 15, scale: 2 })
  amount: number;

  @Column({ default: 'FCFA' })
  currency: string;

  /**
   * Période / cycle correspondant (ex : 2024-03-01 pour mars 2024).
   * Permet de tracer quel cycle a été distribué.
   */
  @Column({ type: 'date' })
  period: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  distributedAt: Date;

  @Column({ nullable: true, type: 'text' })
  notes: string;
}
