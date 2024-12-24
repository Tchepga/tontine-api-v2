import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { ConfigTontine } from './config-tontine.entity';

@Entity({ name: 'rate_map' })
export class RateMap {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    rate: number;

    @Column()
    maxAmount: number;

    @Column()
    minAmount: number;

    @ManyToOne(() => ConfigTontine, (configTontine) => configTontine.rateMaps)
    configTontine: ConfigTontine;
}
