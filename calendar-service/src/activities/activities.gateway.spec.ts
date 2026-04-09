import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import type { Socket } from 'socket.io';

import { AuthService } from '../auth/auth.service';
import { LocksService } from '../locks/locks.service';
import {
  ACTIVITIES_LAST_AUTH_SOCKET_DEBOUNCE_MS,
  ActivitiesGateway,
} from './activities.gateway';

describe('ActivitiesGateway', () => {
  const releaseLocksAfterLastWs = vi.fn().mockResolvedValue(undefined);

  let gateway: ActivitiesGateway;

  const makeAuthedSocket = (id: string, userId: number): Socket =>
    ({
      id,
      data: { authUser: { id: userId } },
      join: vi.fn(),
      leave: vi.fn(),
    }) as unknown as Socket;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ActivitiesGateway,
        { provide: JwtService, useValue: {} },
        { provide: AuthService, useValue: {} },
        {
          provide: LocksService,
          useValue: {
            releaseLocksAndCancelHandoffsAfterLastWsDisconnect:
              releaseLocksAfterLastWs,
          },
        },
      ],
    }).compile();

    gateway = module.get(ActivitiesGateway);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('does not schedule lock release when two tabs disconnect one at a time still leaves one open', () => {
    const s1 = makeAuthedSocket('a', 1);
    const s2 = makeAuthedSocket('b', 1);
    gateway.handleConnection(s1);
    gateway.handleConnection(s2);
    gateway.handleDisconnect(s1);
    expect(releaseLocksAfterLastWs).not.toHaveBeenCalled();
    vi.advanceTimersByTime(ACTIVITIES_LAST_AUTH_SOCKET_DEBOUNCE_MS + 1);
    expect(releaseLocksAfterLastWs).not.toHaveBeenCalled();
  });

  it('schedules lock release when last authenticated socket disconnects', () => {
    const s1 = makeAuthedSocket('a', 1);
    gateway.handleConnection(s1);
    gateway.handleDisconnect(s1);
    expect(releaseLocksAfterLastWs).not.toHaveBeenCalled();
    vi.advanceTimersByTime(ACTIVITIES_LAST_AUTH_SOCKET_DEBOUNCE_MS - 1);
    expect(releaseLocksAfterLastWs).not.toHaveBeenCalled();
    vi.advanceTimersByTime(2);
    expect(releaseLocksAfterLastWs).toHaveBeenCalledTimes(1);
    expect(releaseLocksAfterLastWs).toHaveBeenCalledWith(1);
  });

  it('cancels scheduled release when user reconnects before debounce elapses', () => {
    const s1 = makeAuthedSocket('a', 1);
    gateway.handleConnection(s1);
    gateway.handleDisconnect(s1);
    vi.advanceTimersByTime(5_000);
    const s2 = makeAuthedSocket('b', 1);
    gateway.handleConnection(s2);
    vi.advanceTimersByTime(ACTIVITIES_LAST_AUTH_SOCKET_DEBOUNCE_MS);
    expect(releaseLocksAfterLastWs).not.toHaveBeenCalled();
    gateway.handleDisconnect(s2);
    vi.advanceTimersByTime(ACTIVITIES_LAST_AUTH_SOCKET_DEBOUNCE_MS);
    expect(releaseLocksAfterLastWs).toHaveBeenCalledTimes(1);
    expect(releaseLocksAfterLastWs).toHaveBeenCalledWith(1);
  });

  it('does not touch locks for anonymous disconnects', () => {
    const anon = {
      id: 'x',
      data: {},
      leave: vi.fn(),
    } as unknown as Socket;
    gateway.handleDisconnect(anon);
    vi.advanceTimersByTime(ACTIVITIES_LAST_AUTH_SOCKET_DEBOUNCE_MS);
    expect(releaseLocksAfterLastWs).not.toHaveBeenCalled();
  });

  it('does not release locks if an authenticated socket reconnects before debounce callback runs', () => {
    const s1 = makeAuthedSocket('a', 1);
    gateway.handleConnection(s1);
    gateway.handleDisconnect(s1);
    vi.advanceTimersByTime(ACTIVITIES_LAST_AUTH_SOCKET_DEBOUNCE_MS - 1);
    const s2 = makeAuthedSocket('b', 1);
    gateway.handleConnection(s2);
    vi.advanceTimersByTime(2);
    expect(releaseLocksAfterLastWs).not.toHaveBeenCalled();
    gateway.handleDisconnect(s2);
    vi.advanceTimersByTime(ACTIVITIES_LAST_AUTH_SOCKET_DEBOUNCE_MS);
    expect(releaseLocksAfterLastWs).toHaveBeenCalledTimes(1);
    expect(releaseLocksAfterLastWs).toHaveBeenCalledWith(1);
  });
});
