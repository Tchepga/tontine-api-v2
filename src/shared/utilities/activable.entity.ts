import { Entity, Column } from 'typeorm';

@Entity()
export class ActivableEntity {
  @Column({ default: true })
  isActive: boolean;
}
