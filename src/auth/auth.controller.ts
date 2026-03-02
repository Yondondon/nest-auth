import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { signInDto, signInResponseDto } from '../dto/auth';
import type { AuthenticatedRequest } from '../interfaces';
import { PublicRoute } from '../decorators';

@Controller('auth')
export class AuthController {
  private readonly REFRESH_TOKEN_COOKIE_KEY = 'refresh_token';
  private readonly REFRESH_TOKEN_TTL_MS =
    Number(process.env.JWT_REFRESH_TOKEN_TTL_SECONDS) * 1000 || 604800000; // 7 days

  constructor(private authService: AuthService) {}

  @PublicRoute()
  @HttpCode(HttpStatus.OK)
  @Post('sign-in')
  async signIn(
    @Body() dto: signInDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<signInResponseDto> {
    const { accessToken, refreshToken } = await this.authService.signIn(
      dto.username,
      dto.password,
    );

    this.setRefreshCookie(res, refreshToken);

    return { accessToken };
  }

  @PublicRoute()
  @Post('sign-up')
  signUp(@Body() signUpDto: signInDto): Promise<string> {
    return this.authService.signUp(signUpDto.username, signUpDto.password);
  }

  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<signInResponseDto> {
    const token = req.cookies?.[this.REFRESH_TOKEN_COOKIE_KEY] as
      | string
      | undefined;

    if (!token) {
      throw new UnauthorizedException();
    }

    const { accessToken, refreshToken } = await this.authService.refresh(token);

    this.setRefreshCookie(res, refreshToken);

    return { accessToken };
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Post('sign-out')
  async signOut(
    @Req() req: AuthenticatedRequest,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    const refreshToken = req.cookies?.[this.REFRESH_TOKEN_COOKIE_KEY] as
      | string
      | undefined;
    const { jwtId, exp } = req.user;
    const remainingTtl = Math.max(0, exp - Math.floor(Date.now() / 1000));

    await this.authService.signOut(refreshToken ?? '', jwtId, remainingTtl);

    res.clearCookie(this.REFRESH_TOKEN_COOKIE_KEY, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: this.REFRESH_TOKEN_TTL_MS,
      path: '/',
    });
  }

  @Get('me')
  getProfile(@Req() req: AuthenticatedRequest) {
    return req.user;
  }

  private setRefreshCookie(res: Response, token: string): void {
    res.cookie(this.REFRESH_TOKEN_COOKIE_KEY, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: this.REFRESH_TOKEN_TTL_MS,
      path: '/',
    });
  }
}
