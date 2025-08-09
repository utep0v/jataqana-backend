import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';

@Injectable()
export class AuthService {
  constructor(
    private users: UserService,
    private jwt: JwtService,
  ) {}

  async register(fullName: string, email: string, password: string) {
    const exists = await this.users.findByEmail(email);
    if (exists) throw new ConflictException('Email already registered');
    const user = await this.users.create(fullName, email, password);
    return { id: user.id, fullName: user.fullName, email: user.email };
  }

  async login(email: string, password: string) {
    const user = await this.users.validate(email, password);
    if (!user) throw new UnauthorizedException('Invalid credentials');
    const payload = { sub: user.id, email: user.email };
    const token = await this.jwt.signAsync(payload);
    return {
      access_token: token,
      user: { id: user.id, fullName: user.fullName, email: user.email },
    };
  }
}