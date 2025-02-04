import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Member } from '../../member/entities/member.entity';
import { ConfigTontine } from './config-tontine.entity';

@Entity()
export class PartOrder {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Member)
    member: Member;

    @Column()
    order: number;

    @ManyToOne(() => ConfigTontine, config => config.partOrders)
    config: ConfigTontine;

    @Column()
    period: Date;
} 