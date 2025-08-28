import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { CreateEventDto } from './dto/create-event.dto';
import { EventType } from './enum/event-type';
import { EventService } from './event.service';

describe('EventService', () => {
  let service: EventService;

  const mockDataSource = {
    getRepository: jest.fn().mockReturnValue({
      find: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventService,
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<EventService>(EventService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create an event', async () => {
      const createEventDto: CreateEventDto = {
        tontineId: 1,
        title: 'Test Event',
        type: EventType.MEETING,
        description: 'Test Description',
        startDate: new Date(),
        participants: [1, 2],
      };

      const mockUser = {
        username: 'testuser',
        password: 'password',
        roles: [],
      };
      const mockTontine = { id: 1 };
      const mockAuthor = { id: 1, user: { username: 'testuser' } };
      const mockMember = { id: 1 };

      mockDataSource
        .getRepository()
        .findOne.mockResolvedValueOnce(mockTontine)
        .mockResolvedValueOnce(mockAuthor)
        .mockResolvedValueOnce(mockMember);

      mockDataSource.getRepository().save.mockImplementation((entity) => ({
        ...entity,
        id: 1,
      }));

      const result = await service.create(createEventDto, mockUser);

      expect(result).toBeDefined();
      expect(result.title).toBe(createEventDto.title);
      expect(result.type).toBe(createEventDto.type);
    });

    it('should throw error if tontine not found', async () => {
      const createEventDto: CreateEventDto = {
        tontineId: 999,
        title: 'Test Event',
        type: EventType.MEETING,
        description: 'Test Description',
        startDate: new Date(),
      };

      mockDataSource.getRepository().findOne.mockResolvedValue(null);

      await expect(
        service.create(createEventDto, {
          username: 'test',
          password: 'password',
          roles: [],
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('should return all events for a tontine', async () => {
      const mockTontine = { id: 1 };
      const mockEvents = [
        { id: 1, title: 'Event 1' },
        { id: 2, title: 'Event 2' },
      ];

      mockDataSource.getRepository().findOne.mockResolvedValue(mockTontine);
      mockDataSource.getRepository().find.mockResolvedValue(mockEvents);

      const result = await service.findAll(1);

      expect(result).toEqual(mockEvents);
    });

    it('should throw error if tontine not found', async () => {
      mockDataSource.getRepository().findOne.mockResolvedValue(null);

      await expect(service.findAll(999)).rejects.toThrow(BadRequestException);
    });
  });

  describe('update', () => {
    it('should update an event', async () => {
      const mockEvent = {
        id: 1,
        title: 'Old Title',
        author: { user: { username: 'testuser' } },
      };

      const updateEventDto = {
        title: 'New Title',
      };

      mockDataSource.getRepository().findOne.mockResolvedValue(mockEvent);
      mockDataSource
        .getRepository()
        .save.mockImplementation((entity) => entity);

      const result = await service.update(1, updateEventDto, {
        username: 'testuser',
        password: 'password',
        roles: [],
      });

      expect(result.title).toBe(updateEventDto.title);
    });

    it('should throw error if user is not event owner', async () => {
      const mockEvent = {
        id: 1,
        author: { user: { username: 'otheruser' } },
      };

      mockDataSource.getRepository().findOne.mockResolvedValue(mockEvent);

      await expect(
        service.update(1, { title: 'New Title' }, { username: 'testuser', password: 'password', roles: [] }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('addParticipant', () => {
    it('should add participant to event', async () => {
      const mockEvent = {
        id: 1,
        participants: [],
      };
      const mockMember = { id: 2 };

      mockDataSource
        .getRepository()
        .findOne.mockResolvedValueOnce(mockEvent)
        .mockResolvedValueOnce(mockMember);
      mockDataSource
        .getRepository()
        .save.mockImplementation((entity) => entity);

      const result = await service.addParticipant(1, 2);

      expect(result.participants).toContain(mockMember);
    });

    it('should throw error if event not found', async () => {
      mockDataSource.getRepository().findOne.mockResolvedValue(null);

      await expect(service.addParticipant(999, 1)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('removeParticipant', () => {
    it('should remove participant from event', async () => {
      const mockMember = { id: 2 };
      const mockEvent = {
        id: 1,
        participants: [mockMember],
      };

      mockDataSource
        .getRepository()
        .findOne.mockResolvedValueOnce(mockEvent)
        .mockResolvedValueOnce(mockMember);
      mockDataSource
        .getRepository()
        .save.mockImplementation((entity) => entity);

      const result = await service.removeParticipant(1, 2);

      expect(result.participants).not.toContain(mockMember);
    });
  });
});
