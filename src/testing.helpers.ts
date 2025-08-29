import { DataSource, EntityManager, Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { AuthentificationService } from './authentification/authentification.service';
import { NotificationService } from './notification/notification.service';
import { MemberService } from './member/member.service';
import { TontineService } from './tontine/tontine.service';
import { Reflector } from '@nestjs/core';
import { Tontine } from './tontine/entities/tontine.entity';

export const mockDataSource = {
  getRepository: jest.fn().mockReturnValue({
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      innerJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getOne: jest.fn(),
    })),
  }),
};

export const mockJwtService = {
  verify: jest.fn(),
  sign: jest.fn(),
};

export const mockEntityManager = {
  query: jest.fn(),
};

export const mockAuthentificationService = {
  register: jest.fn(),
  findByUsername: jest.fn(),
  login: jest.fn(),
  verify: jest.fn(),
  getHashedPassword: jest.fn(),
  getUserByUsername: jest.fn(),
};

export const mockNotificationService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findFromTontine: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

export const mockMemberService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  findByUsername: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  validatePassword: jest.fn(),
};

export const mockTontineService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  findByMember: jest.fn(),
  setSelectedTontine: jest.fn(),
  createDeposit: jest.fn(),
  getDeposits: jest.fn(),
  updateDeposit: jest.fn(),
  removeDeposit: jest.fn(),
};

export const mockTontineRepository = {
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  createQueryBuilder: jest.fn(() => ({
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getOne: jest.fn(),
    getMany: jest.fn(),
  })),
};

export const mockReflector = {
  get: jest.fn(),
};

export const mockProviders = [
  { provide: DataSource, useValue: mockDataSource },
  { provide: JwtService, useValue: mockJwtService },
  { provide: EntityManager, useValue: mockEntityManager },
  { provide: AuthentificationService, useValue: mockAuthentificationService },
  { provide: NotificationService, useValue: mockNotificationService },
  { provide: MemberService, useValue: mockMemberService },
  { provide: Reflector, useValue: mockReflector },
];