import { Entity, Column } from 'typeorm';

@Entity()
export class BasicEntity {
  @Column({ default: true })
  isActive: boolean;
}
