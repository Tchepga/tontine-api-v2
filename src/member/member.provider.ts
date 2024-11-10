import { DataSource } from 'typeorm';
import { Member } from './entities/member.entity';

export const memberProviders = [
  {
    provide: 'MEMBER_REPOSITORY',
    useFactory: (dataSource: DataSource) => dataSource.getRepository(Member),
    inject: ['DATA_SOURCE'],
  },
];
