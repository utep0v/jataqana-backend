import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import { JwtAuthGuard } from './guard/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly users: UserService,
  ) {}

  @Post('register')
  register(
    @Body() body: { fullName: string; email: string; password: string },
  ) {
    return this.auth.register(body.fullName, body.email, body.password);
  }

  @Post('login')
  login(@Body() body: { email: string; password: string }) {
    return this.auth.login(body.email, body.password);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@Req() req: any) {
    const userId = req.user?.userId ?? req.user?.sub;
    const user = await this.users.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      createdAt: user.createdAt,
    };
  }
}
