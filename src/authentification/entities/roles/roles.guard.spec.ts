import {
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Role } from './roles.enum';
import { ROLES_KEY } from './roles.decorator';
import { IS_PUBLIC_KEY } from '../public.decorator';
import { SKIP_TONTINE_CONTEXT_KEY } from './skip-tontine-context.decorator';
import { RolesGuard } from './roles.guard';
import { TontineService } from 'src/tontine/tontine.service';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;
  let jwtService: JwtService;
  let tontineService: TontineService;

  const createContext = (request: Record<string, unknown>): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => request,
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    }) as ExecutionContext;

  beforeEach(() => {
    reflector = new Reflector();
    jwtService = {
      verifyAsync: jest.fn(),
    } as unknown as JwtService;
    tontineService = {
      getMemberRoles: jest.fn(),
    } as unknown as TontineService;
    guard = new RolesGuard(reflector, jwtService, tontineService);
  });

  it('allows @SkipTontineContext routes with JWT but without tontine-id', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
      if (key === IS_PUBLIC_KEY) return false;
      if (key === ROLES_KEY) return [Role.TONTINARD];
      if (key === SKIP_TONTINE_CONTEXT_KEY) return true;
      return undefined;
    });
    jest.spyOn(jwtService, 'verifyAsync').mockResolvedValue({ username: 'alice' });

    const request = {
      headers: { authorization: 'Bearer valid-token' },
    };
    const context = createContext(request);

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(tontineService.getMemberRoles).not.toHaveBeenCalled();
    expect(request['user']).toEqual({ username: 'alice' });
  });

  it('still requires JWT on @SkipTontineContext routes', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
      if (key === IS_PUBLIC_KEY) return false;
      if (key === ROLES_KEY) return [Role.TONTINARD];
      if (key === SKIP_TONTINE_CONTEXT_KEY) return true;
      return undefined;
    });

    const context = createContext({ headers: {} });

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('requires tontine-id when @Roles is set without @SkipTontineContext', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
      if (key === IS_PUBLIC_KEY) return false;
      if (key === ROLES_KEY) return [Role.TONTINARD];
      if (key === SKIP_TONTINE_CONTEXT_KEY) return false;
      return undefined;
    });
    jest.spyOn(jwtService, 'verifyAsync').mockResolvedValue({ username: 'alice' });

    const context = createContext({
      headers: { authorization: 'Bearer valid-token' },
      params: {},
    });

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });
});
