import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { UsersService } from './users.service';
import { SignupDto } from './dtos/signup.dto';
import { LoginDto } from './dtos/login.dto';
import { AuthGuard } from '../../common/guards/auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private usersService: UsersService) {}

  @Post('signup')
  async signup(@Body() signupDto: SignupDto) {
    return this.usersService.signup(signupDto);
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.usersService.login(loginDto);
  }

  @Post('logout')
  @UseGuards(AuthGuard)
  async logout(@Request() req: any) {
    return this.usersService.logout(req.user._id.toString());
  }
}

