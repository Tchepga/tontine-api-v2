import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, RelationId } from 'typeorm';
import { Member } from '../../member/entities/member.entity';
import { ConfigTontine } from './config-tontine.entity';

@Entity()
export class PartOrder {
  @PrimaryGeneratedColumn()
  id: number;

  /** Eager : le nom du membre doit toujours être présent côté client. */
  @ManyToOne(() => Member, { eager: true, nullable: false })
  @JoinColumn({ name: 'memberId' })
  member: Member;

  /** Exposé dans le JSON même si la relation n'est pas hydratée. */
  @RelationId((partOrder: PartOrder) => partOrder.member)
  memberId: number;

  @Column()
  order: number;

  @ManyToOne(() => ConfigTontine, (config) => config.partOrders)
  config: ConfigTontine;

  @Column()
  period: Date;
}
