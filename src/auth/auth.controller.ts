import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Request,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { signInDto, signInResponseDto } from '../dto/auth';
import type { AuthenticatedRequest } from '../interfaces';
import { PublicRoute } from '../decorators';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @PublicRoute()
  @HttpCode(HttpStatus.OK)
  @Post('sign-in')
  signIn(@Body() signInDto: signInDto): Promise<signInResponseDto> {
    return this.authService.signIn(signInDto.username, signInDto.password);
  }

  @PublicRoute()
  @Post('sign-up')
  signUp(@Body() signUpDto: signInDto): Promise<string> {
    return this.authService.signUp(signUpDto.username, signUpDto.password);
  }

  @Get('me')
  getProfile(@Request() req: AuthenticatedRequest) {
    return req.user;
  }
}
