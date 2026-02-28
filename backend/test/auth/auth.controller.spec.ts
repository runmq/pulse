import { Test, TestingModule } from '@nestjs/testing';
import {AuthController} from "../../src/auth/auth.controller";
import {AuthService} from "../../src/auth/auth.service";

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    login: jest.fn().mockResolvedValue({
      accessToken: 'mock-token',
      user: { id: '1', username: 'admin', role: 'admin' },
    }),
    reloadUsers: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('login', () => {
    it('should return access token and user', async () => {
      const result = await controller.login({
        username: 'admin',
        password: 'admin123',
      });

      expect(result.accessToken).toBe('mock-token');
      expect(result.user.username).toBe('admin');
      expect(mockAuthService.login).toHaveBeenCalled();
    });
  });

  describe('getCurrentUser', () => {
    it('should return current user info', async () => {
      const mockUser = { id: '1', username: 'admin', role: 'admin' };
      const result = await controller.getCurrentUser(mockUser);

      expect(result).toEqual(mockUser);
    });
  });

  describe('reloadUsers', () => {
    it('should call reloadUsers and return success message', () => {
      const result = controller.reloadUsers();

      expect(mockAuthService.reloadUsers).toHaveBeenCalled();
      expect(result.message).toBe('Users reloaded successfully');
    });
  });
});
