import {
  Injectable,
  UnauthorizedException,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import * as fs from 'fs';
import { User } from './interfaces/user.interface';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { AppConfig } from '../configs';

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly logger = new Logger(AuthService.name);
  private users: User[] = [];

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService<AppConfig>,
  ) {}

  onModuleInit() {
    this.loadUsers();
  }

  /**
   * Load users from JSON config file
   */
  private loadUsers(): void {
    const configPath = this.configService.get('usersConfigPath', {
      infer: true,
    })!;

    try {
      const fileContent = fs.readFileSync(configPath, 'utf-8');
      const config = JSON.parse(fileContent);
      this.users = config.users || [];
      this.logger.log(
        `Loaded ${this.users.length} user(s) from ${configPath}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to load users config from ${configPath}`,
        error,
      );
      this.users = [];
    }
  }

  /**
   * Validate user credentials
   */
  async validateUser(username: string, password: string): Promise<User | null> {
    const user = this.users.find((u) => u.username === username);

    if (!user) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return null;
    }

    return user;
  }

  /**
   * Login and generate JWT token
   */
  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.validateUser(loginDto.username, loginDto.password);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = {
      sub: user.id,
      username: user.username,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
    };
  }

  /**
   * Validate JWT payload and return user
   */
  async validateJwtPayload(payload: any): Promise<User | null> {
    const user = this.users.find((u) => u.id === payload.sub);
    return user || null;
  }

  /**
   * Get user by ID
   */
  getUserById(id: string): User | null {
    return this.users.find((u) => u.id === id) || null;
  }

  /**
   * Reload users from config (useful for development)
   */
  reloadUsers(): void {
    this.loadUsers();
    this.logger.log('Users reloaded');
  }
}
