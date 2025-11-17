import { ExecutionContext } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { WsJwtGuard } from './ws-jwt.guard';
import { environment } from '../../shared/config';

describe('WsJwtGuard', () => {
  let guard: WsJwtGuard;
  let jwtService: jest.Mocked<JwtService>;
  let mockContext: ExecutionContext;
  let mockSocket: Partial<Socket>;

  beforeEach(() => {
    jwtService = {
      verifyAsync: jest.fn(),
    } as any;

    mockSocket = {
      id: 'test-socket-id',
      data: {},
      handshake: {
        query: {},
        headers: {},
      } as any,
    };

    mockContext = {
      switchToWs: jest.fn().mockReturnValue({
        getClient: jest.fn().mockReturnValue(mockSocket),
      }),
    } as any;

    guard = new WsJwtGuard(jwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    it('should allow connection with valid token in query params', async () => {
      const token = 'valid-jwt-token';
      const payload = { username: 'testuser', sub: '123' };

      mockSocket.handshake.query = { token };
      jwtService.verifyAsync.mockResolvedValue(payload);

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(true);
      expect(jwtService.verifyAsync).toHaveBeenCalledWith(token, {
        secret: environment.jwtConfig.secret,
      });
      expect(mockSocket.data.user).toEqual(payload);
    });

    it('should allow connection with valid token in Authorization header', async () => {
      const token = 'valid-jwt-token';
      const payload = { username: 'testuser', sub: '123' };

      mockSocket.handshake.query = {};
      mockSocket.handshake.headers = { authorization: `Bearer ${token}` };
      jwtService.verifyAsync.mockResolvedValue(payload);

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(true);
      expect(jwtService.verifyAsync).toHaveBeenCalledWith(token, {
        secret: environment.jwtConfig.secret,
      });
      expect(mockSocket.data.user).toEqual(payload);
    });

    it('should throw WsException when token is missing', async () => {
      mockSocket.handshake.query = {};
      mockSocket.handshake.headers = {};

      await expect(guard.canActivate(mockContext)).rejects.toThrow(WsException);
      await expect(guard.canActivate(mockContext)).rejects.toThrow(
        'Token manquant',
      );
      expect(jwtService.verifyAsync).not.toHaveBeenCalled();
    });

    it('should throw WsException when token is invalid', async () => {
      const token = 'invalid-token';
      mockSocket.handshake.query = { token };
      jwtService.verifyAsync.mockRejectedValue(new Error('Invalid token'));

      await expect(guard.canActivate(mockContext)).rejects.toThrow(WsException);
      await expect(guard.canActivate(mockContext)).rejects.toThrow(
        'Token invalide',
      );
    });

    it('should handle token as array in query params', async () => {
      const token = 'valid-jwt-token';
      const payload = { username: 'testuser', sub: '123' };

      mockSocket.handshake.query = { token: [token] };
      jwtService.verifyAsync.mockResolvedValue(payload);

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(true);
      expect(jwtService.verifyAsync).toHaveBeenCalledWith(token, {
        secret: environment.jwtConfig.secret,
      });
    });

    it('should prioritize query params over Authorization header', async () => {
      const queryToken = 'query-token';
      const headerToken = 'header-token';
      const payload = { username: 'testuser', sub: '123' };

      mockSocket.handshake.query = { token: queryToken };
      mockSocket.handshake.headers = { authorization: `Bearer ${headerToken}` };
      jwtService.verifyAsync.mockResolvedValue(payload);

      await guard.canActivate(mockContext);

      expect(jwtService.verifyAsync).toHaveBeenCalledWith(queryToken, {
        secret: environment.jwtConfig.secret,
      });
      expect(jwtService.verifyAsync).not.toHaveBeenCalledWith(headerToken, {
        secret: environment.jwtConfig.secret,
      });
    });
  });
});
