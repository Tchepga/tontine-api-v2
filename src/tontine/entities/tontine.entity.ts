import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Tontine {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;
}
