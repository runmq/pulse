import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import * as fs from 'fs';
import {AuthService} from "../../src/auth/auth.service";

jest.mock('fs');

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: JwtService;

  const hashedPassword = bcrypt.hashSync('admin123', 10);

  const mockUsersConfig = {
    users: [
      {
        id: '1',
        username: 'admin',
        password: hashedPassword,
        role: 'admin',
        createdAt: '2026-02-27T00:00:00.000Z',
      },
    ],
  };

  beforeEach(async () => {
    (fs.readFileSync as jest.Mock).mockReturnValue(
      JSON.stringify(mockUsersConfig),
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('mock-jwt-token'),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('./config/users.json'),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);

    // Trigger user loading
    service.onModuleInit();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('should return user for valid credentials', async () => {
      const user = await service.validateUser('admin', 'admin123');
      expect(user).toBeDefined();
      expect(user!.username).toBe('admin');
    });

    it('should return null for invalid username', async () => {
      const user = await service.validateUser('nonexistent', 'admin123');
      expect(user).toBeNull();
    });

    it('should return null for invalid password', async () => {
      const user = await service.validateUser('admin', 'wrongpassword');
      expect(user).toBeNull();
    });
  });

  describe('login', () => {
    it('should return access token and user info for valid credentials', async () => {
      const result = await service.login({
        username: 'admin',
        password: 'admin123',
      });

      expect(result.accessToken).toBe('mock-jwt-token');
      expect(result.user.username).toBe('admin');
      expect(result.user.role).toBe('admin');
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: '1',
        username: 'admin',
        role: 'admin',
      });
    });

    it('should throw UnauthorizedException for invalid credentials', async () => {
      await expect(
        service.login({ username: 'admin', password: 'wrong' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('validateJwtPayload', () => {
    it('should return user for valid payload', async () => {
      const user = await service.validateJwtPayload({ sub: '1' });
      expect(user).toBeDefined();
      expect(user!.username).toBe('admin');
    });

    it('should return null for invalid payload', async () => {
      const user = await service.validateJwtPayload({ sub: 'nonexistent' });
      expect(user).toBeNull();
    });
  });

  describe('getUserById', () => {
    it('should return user by id', () => {
      const user = service.getUserById('1');
      expect(user).toBeDefined();
      expect(user!.username).toBe('admin');
    });

    it('should return null for unknown id', () => {
      const user = service.getUserById('999');
      expect(user).toBeNull();
    });
  });

  describe('loadUsers', () => {
    it('should handle missing config file gracefully', () => {
      (fs.readFileSync as jest.Mock).mockImplementation(() => {
        throw new Error('File not found');
      });

      service.reloadUsers();
      expect(service.getUserById('1')).toBeNull();
    });
  });
});
