import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { NotificationService } from 'src/notification/notification.service';
import { Role } from '../authentification/entities/roles/roles.enum';
import { User } from '../authentification/entities/user.entity';
import { CreateEventDto } from './dto/create-event.dto';
import { EventType } from './enum/event-type';
import { EventService } from './event.service';

const mockUser = {
  username: 'testuser',
  password: 'secret',
  roles: [Role.TONTINARD],
} as User;

describe('EventService', () => {
  let service: EventService;

  const mockRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  };

  const mockDataSource = {
    getRepository: jest.fn().mockReturnValue(mockRepository),
  };

  const mockNotificationService = {
    create: jest.fn(),
    notify: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    mockDataSource.getRepository.mockReturnValue(mockRepository);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventService,
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
        {
          provide: NotificationService,
          useValue: mockNotificationService,
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

      const mockTontine = { id: 1 };
      const mockAuthor = { id: 1, user: { username: 'testuser' } };
      const mockMember = { id: 1 };

      mockRepository.findOne
        .mockResolvedValueOnce(mockTontine)
        .mockResolvedValueOnce(mockAuthor)
        .mockResolvedValueOnce(mockMember)
        .mockResolvedValueOnce(mockMember);

      mockRepository.save.mockImplementation((entity) => ({
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

      mockRepository.findOne.mockResolvedValue(null);

      await expect(
        service.create(createEventDto, {
          ...mockUser,
          username: 'test',
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

      mockRepository.findOne.mockResolvedValue(mockTontine);
      mockRepository.find.mockResolvedValue(mockEvents);

      const result = await service.findAll(1);

      expect(result).toEqual(mockEvents);
    });

    it('should throw error if tontine not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

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

      mockRepository.findOne.mockResolvedValue(mockEvent);
      mockRepository.save.mockImplementation((entity) => entity);

      const result = await service.update(1, updateEventDto, mockUser);

      expect(result.title).toBe(updateEventDto.title);
    });

    it('should throw error if user is not event owner', async () => {
      const mockEvent = {
        id: 1,
        author: { user: { username: 'otheruser' } },
      };

      mockRepository.findOne.mockResolvedValue(mockEvent);

      await expect(
        service.update(1, { title: 'New Title' }, mockUser),
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

      mockRepository.findOne
        .mockResolvedValueOnce(mockEvent)
        .mockResolvedValueOnce(mockMember);
      mockRepository.save.mockImplementation((entity) => entity);

      const result = await service.addParticipant(1, 2);

      expect(result.participants).toContain(mockMember);
    });

    it('should throw error if event not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

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

      mockRepository.findOne
        .mockResolvedValueOnce(mockEvent)
        .mockResolvedValueOnce(mockMember);
      mockRepository.save.mockImplementation((entity) => entity);

      const result = await service.removeParticipant(1, 2);

      expect(result.participants).not.toContain(mockMember);
    });
  });
});
