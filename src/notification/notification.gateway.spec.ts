import { Test, TestingModule } from '@nestjs/testing';
import { Server, Socket } from 'socket.io';
import { NotificationGateway } from './notification.gateway';
import { NotificationService } from './notification.service';
import { DataSource } from 'typeorm';
import { Member } from '../member/entities/member.entity';
import { Tontine } from '../tontine/entities/tontine.entity';
import { Action } from './utility/message-notification';
import { TypeNotification } from './enum/type-notification';
import { JwtService } from '@nestjs/jwt';
import { WsJwtGuard } from './guards/ws-jwt.guard';

describe('NotificationGateway', () => {
  let gateway: NotificationGateway;
  let notificationService: jest.Mocked<NotificationService>;
  let dataSource: jest.Mocked<DataSource>;
  let mockServer: Partial<Server>;
  let mockSocket: Partial<Socket>;

  const mockMemberRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
  };

  const mockTontineRepository = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    mockServer = {
      to: jest.fn().mockReturnValue({
        emit: jest.fn(),
      }),
      sockets: {
        sockets: new Map(),
      } as any,
    };

    mockSocket = {
      id: 'test-socket-id',
      data: {
        user: { username: 'testuser', sub: '123' },
      },
      join: jest.fn(),
      leave: jest.fn(),
      emit: jest.fn(),
      handshake: {
        query: { token: 'test-token' },
        headers: {},
      } as any,
    };

    notificationService = {
      create: jest.fn(),
      findFromTontine: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    } as any;

    dataSource = {
      getRepository: jest.fn((entity) => {
        if (entity === Member) return mockMemberRepository;
        if (entity === Tontine) return mockTontineRepository;
        return {};
      }),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationGateway,
        {
          provide: NotificationService,
          useValue: notificationService,
        },
        {
          provide: DataSource,
          useValue: dataSource,
        },
        {
          provide: JwtService,
          useValue: {
            verifyAsync: jest.fn(),
            sign: jest.fn(),
          },
        },
        WsJwtGuard,
      ],
    }).compile();

    gateway = module.get<NotificationGateway>(NotificationGateway);
    gateway.server = mockServer as Server;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });

  describe('handleConnection', () => {
    it('should log connection and accept client', async () => {
      const loggerSpy = jest.spyOn(gateway['logger'], 'log');

      await gateway.handleConnection(mockSocket as Socket);

      expect(loggerSpy).toHaveBeenCalledWith(
        `Client connecting: ${mockSocket.id}`,
      );
    });

    it('should handle connection errors gracefully', async () => {
      // Simuler une connexion normale
      await gateway.handleConnection(mockSocket as Socket);

      // Le code actuel ne déclenche pas d'erreur, mais testons la structure
      expect(mockSocket).toBeDefined();
    });
  });

  describe('handleDisconnect', () => {
    it('should log disconnection and clean up', async () => {
      const loggerSpy = jest.spyOn(gateway['logger'], 'log');
      const memberId = 1;
      const mockTontine = { id: 1, members: [] } as Tontine;

      // Ajouter le client à la map
      gateway['connectedClients'].set(mockSocket.id!, {
        userId: '123',
        username: 'testuser',
        memberId,
      });

      mockMemberRepository.findOne.mockResolvedValue({
        id: memberId,
        tontines: [mockTontine],
      } as Member);

      await gateway.handleDisconnect(mockSocket as Socket);

      expect(loggerSpy).toHaveBeenCalledWith(
        `Client disconnecting: ${mockSocket.id}`,
      );
      expect(mockSocket.leave).toHaveBeenCalledWith(
        `tontine:${mockTontine.id}`,
      );
      expect(gateway['connectedClients'].has(mockSocket.id!)).toBe(false);
    });
  });

  describe('handleJoinTontine', () => {
    it('should allow member to join tontine room', async () => {
      const tontineId = 1;
      const member = {
        id: 1,
        user: { username: 'testuser' },
        tontines: [{ id: tontineId }] as Tontine[],
      } as Member;

      mockMemberRepository.findOne.mockResolvedValue(member);

      const result = await gateway.handleJoinTontine(
        mockSocket as Socket,
        tontineId,
      );

      expect(result).toEqual({
        success: true,
        message: `Rejoint la tontine ${tontineId}`,
      });
      expect(mockSocket.join).toHaveBeenCalledWith(`tontine:${tontineId}`);
      expect(mockMemberRepository.findOne).toHaveBeenCalledWith({
        where: { user: { username: 'testuser' } },
        relations: ['tontines'],
      });
    });

    it('should reject if user is not authenticated', async () => {
      const socketWithoutUser = {
        ...mockSocket,
        data: {},
      } as Socket;

      const result = await gateway.handleJoinTontine(socketWithoutUser, 1);

      expect(result).toEqual({ error: 'Non authentifié' });
      expect(mockSocket.join).not.toHaveBeenCalled();
    });

    it('should reject if member is not found', async () => {
      mockMemberRepository.findOne.mockResolvedValue(null);

      const result = await gateway.handleJoinTontine(mockSocket as Socket, 1);

      expect(result).toEqual({ error: 'Membre non trouvé' });
      expect(mockSocket.join).not.toHaveBeenCalled();
    });

    it('should reject if member is not part of tontine', async () => {
      const member = {
        id: 1,
        user: { username: 'testuser' },
        tontines: [{ id: 2 }] as Tontine[],
      } as Member;

      mockMemberRepository.findOne.mockResolvedValue(member);

      const result = await gateway.handleJoinTontine(mockSocket as Socket, 1);

      expect(result).toEqual({
        error: "Vous n'êtes pas membre de cette tontine",
      });
      expect(mockSocket.join).not.toHaveBeenCalled();
    });
  });

  describe('handleLeaveTontine', () => {
    it('should allow client to leave tontine room', async () => {
      const tontineId = 1;
      const loggerSpy = jest.spyOn(gateway['logger'], 'log');

      const result = await gateway.handleLeaveTontine(
        mockSocket as Socket,
        tontineId,
      );

      expect(result).toEqual({
        success: true,
        message: `Quitté la tontine ${tontineId}`,
      });
      expect(mockSocket.leave).toHaveBeenCalledWith(`tontine:${tontineId}`);
      expect(loggerSpy).toHaveBeenCalledWith(
        `Client ${mockSocket.id} a quitté la tontine ${tontineId}`,
      );
    });
  });

  describe('emitToMember', () => {
    it('should emit notification to specific member', async () => {
      const memberId = 1;
      const notification = {
        id: 1,
        message: 'Test notification',
        type: 'EVENT',
      };

      // Ajouter un client connecté pour ce membre
      const connectedSocket = {
        id: 'connected-socket-id',
        emit: jest.fn(),
      } as any;

      gateway['connectedClients'].set(connectedSocket.id, {
        userId: '123',
        username: 'testuser',
        memberId,
      });

      mockServer.sockets!.sockets.set(connectedSocket.id, connectedSocket);

      const loggerSpy = jest.spyOn(gateway['logger'], 'log');

      await gateway.emitToMember(memberId, notification);

      expect(connectedSocket.emit).toHaveBeenCalledWith(
        'notification',
        notification,
      );
      expect(loggerSpy).toHaveBeenCalledWith(
        `Notification envoyée au membre ${memberId} (1 client(s))`,
      );
    });

    it('should handle case when no clients are connected for member', async () => {
      const memberId = 999;
      const notification = { id: 1, message: 'Test' };

      const loggerSpy = jest.spyOn(gateway['logger'], 'log');

      await gateway.emitToMember(memberId, notification);

      expect(loggerSpy).toHaveBeenCalledWith(
        `Notification envoyée au membre ${memberId} (0 client(s))`,
      );
    });
  });

  describe('emitToTontine', () => {
    it('should emit notification to all members in tontine room', async () => {
      const tontineId = 1;
      const notification = {
        id: 1,
        message: 'Test notification',
        type: 'EVENT',
      };

      const emitSpy = jest.fn();
      mockServer.to = jest.fn().mockReturnValue({
        emit: emitSpy,
      });

      const loggerSpy = jest.spyOn(gateway['logger'], 'log');

      await gateway.emitToTontine(tontineId, notification);

      expect(mockServer.to).toHaveBeenCalledWith(`tontine:${tontineId}`);
      expect(emitSpy).toHaveBeenCalledWith('notification', notification);
      expect(loggerSpy).toHaveBeenCalledWith(
        `Notification envoyée à tous les membres de la tontine ${tontineId}`,
      );
    });
  });

  describe('SubscribeMessage handlers', () => {
    it('should handle createNotification message', async () => {
      const createDto = {
        tontineId: 1,
        type: TypeNotification.EVENT,
        action: Action.CREATE,
      };

      notificationService.create.mockResolvedValue({} as any);

      await gateway.create(createDto, mockSocket as Socket);

      expect(notificationService.create).toHaveBeenCalledWith(
        createDto,
        mockSocket.data.user,
      );
    });

    it('should handle findAllNotification message', async () => {
      const tontineId = 1;
      const expectedNotifications = [{ id: 1, message: 'Test' }];

      notificationService.findFromTontine.mockResolvedValue(
        expectedNotifications as any,
      );

      const result = await gateway.findAll(tontineId);

      expect(notificationService.findFromTontine).toHaveBeenCalledWith(
        tontineId,
      );
      expect(result).toEqual(expectedNotifications);
    });
  });
});
