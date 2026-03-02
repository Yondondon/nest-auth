import { Test } from '@nestjs/testing';
import {
  HttpException,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { signInDto, signInResponseDto } from '../dto/auth';
import { AuthenticatedRequest, JwtPayload, TokenPair } from '../interfaces';
import type { Request, Response } from 'express';

describe('AuthController', () => {
  let authController: AuthController;
  let authService: jest.Mocked<AuthService>;

  const mockSignInDto: signInDto = {
    username: 'testuser',
    password: 'password123',
  };

  const mockTokenPair: TokenPair = {
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
  };

  const mockSignInResponse: signInResponseDto = {
    accessToken: 'mock-access-token',
  };

  const mockJwtPayload: JwtPayload = {
    sub: '00000000-0000-0000-0000-000000000000',
    username: 'testuser',
    jwtId: 'mock-jwt-id',
    exp: Math.floor(Date.now() / 1000) + 3600,
  };

  const mockRes = {
    cookie: jest.fn(),
    clearCookie: jest.fn(),
  } as unknown as Response;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            signIn: jest.fn(),
            signUp: jest.fn(),
            refresh: jest.fn(),
            signOut: jest.fn(),
          },
        },
      ],
    }).compile();

    authController = moduleRef.get<AuthController>(AuthController);
    authService = moduleRef.get(AuthService);

    jest.clearAllMocks();
  });

  describe('signIn', () => {
    it('should return access token and set refresh token cookie on success', async () => {
      authService.signIn.mockResolvedValue(mockTokenPair);

      const result = await authController.signIn(mockSignInDto, mockRes);

      expect(result).toEqual(mockSignInResponse);
      expect(authService.signIn).toHaveBeenCalledWith(
        mockSignInDto.username,
        mockSignInDto.password,
      );
      expect(authService.signIn).toHaveBeenCalledTimes(1);
      expect(mockRes.cookie).toHaveBeenCalledWith(
        'refresh_token',
        mockTokenPair.refreshToken,
        expect.objectContaining({ httpOnly: true }),
      );
    });

    it('should throw UnauthorizedException when credentials are invalid', async () => {
      authService.signIn.mockRejectedValue(new UnauthorizedException());

      await expect(
        authController.signIn(mockSignInDto, mockRes),
      ).rejects.toThrow(UnauthorizedException);
      expect(authService.signIn).toHaveBeenCalledTimes(1);
    });

    it('should propagate service errors', async () => {
      const error = new HttpException(
        'User does not exist',
        HttpStatus.BAD_REQUEST,
      );
      authService.signIn.mockRejectedValue(error);

      await expect(
        authController.signIn(mockSignInDto, mockRes),
      ).rejects.toThrow(error);
      expect(authService.signIn).toHaveBeenCalledTimes(1);
    });
  });

  describe('signUp', () => {
    it('should return user uuid on successful sign up', async () => {
      const mockUuid = '00000000-0000-0000-0000-000000000000';
      authService.signUp.mockResolvedValue(mockUuid);

      const result = await authController.signUp(mockSignInDto);

      expect(result).toBe(mockUuid);
      expect(authService.signUp).toHaveBeenCalledWith(
        mockSignInDto.username,
        mockSignInDto.password,
      );
      expect(authService.signUp).toHaveBeenCalledTimes(1);
    });

    it('should throw when user already exists', async () => {
      const error = new HttpException(
        'User already exists',
        HttpStatus.BAD_REQUEST,
      );
      authService.signUp.mockRejectedValue(error);

      await expect(authController.signUp(mockSignInDto)).rejects.toThrow(error);
      expect(authService.signUp).toHaveBeenCalledTimes(1);
    });

    it('should propagate service errors', async () => {
      const error = new HttpException(
        'Database error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
      authService.signUp.mockRejectedValue(error);

      await expect(authController.signUp(mockSignInDto)).rejects.toThrow(error);
      expect(authService.signUp).toHaveBeenCalledTimes(1);
    });
  });

  describe('refresh', () => {
    const mockReq = (cookie?: string) =>
      ({ cookies: { refresh_token: cookie } }) as unknown as Request;

    it('should return new access token and rotate refresh token cookie on success', async () => {
      const newTokenPair: TokenPair = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      };
      authService.refresh.mockResolvedValue(newTokenPair);

      const result = await authController.refresh(
        mockReq('old-refresh-token'),
        mockRes,
      );

      expect(result).toEqual({ accessToken: 'new-access-token' });
      expect(authService.refresh).toHaveBeenCalledWith('old-refresh-token');
      expect(authService.refresh).toHaveBeenCalledTimes(1);
      expect(mockRes.cookie).toHaveBeenCalledWith(
        'refresh_token',
        newTokenPair.refreshToken,
        expect.objectContaining({ httpOnly: true }),
      );
    });

    it('should throw UnauthorizedException when refresh token cookie is missing', async () => {
      await expect(
        authController.refresh(mockReq(undefined), mockRes),
      ).rejects.toThrow(UnauthorizedException);
      expect(authService.refresh).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when token is invalid or expired', async () => {
      authService.refresh.mockRejectedValue(new UnauthorizedException());

      await expect(
        authController.refresh(mockReq('invalid-token'), mockRes),
      ).rejects.toThrow(UnauthorizedException);
      expect(authService.refresh).toHaveBeenCalledTimes(1);
    });
  });

  describe('signOut', () => {
    const makeAuthReq = (cookie?: string): AuthenticatedRequest =>
      ({
        user: mockJwtPayload,
        cookies: { refresh_token: cookie },
      }) as unknown as AuthenticatedRequest;

    it('should call signOut with refresh token, jwtId and remaining ttl', async () => {
      authService.signOut.mockResolvedValue(undefined);

      await authController.signOut(makeAuthReq('valid-refresh-token'), mockRes);

      expect(authService.signOut).toHaveBeenCalledWith(
        'valid-refresh-token',
        mockJwtPayload.jwtId,
        expect.any(Number),
      );
      expect(authService.signOut).toHaveBeenCalledTimes(1);
      expect(mockRes.clearCookie).toHaveBeenCalledWith(
        'refresh_token',
        expect.objectContaining({ httpOnly: true }),
      );
    });

    it('should use empty string when refresh token cookie is missing', async () => {
      authService.signOut.mockResolvedValue(undefined);

      await authController.signOut(makeAuthReq(undefined), mockRes);

      expect(authService.signOut).toHaveBeenCalledWith(
        '',
        mockJwtPayload.jwtId,
        expect.any(Number),
      );
    });

    it('should propagate service errors', async () => {
      const error = new HttpException(
        'Internal error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
      authService.signOut.mockRejectedValue(error);

      await expect(
        authController.signOut(makeAuthReq('valid-refresh-token'), mockRes),
      ).rejects.toThrow(error);
    });
  });

  describe('getProfile', () => {
    it('should return the user payload from the request', () => {
      const req = { user: mockJwtPayload } as AuthenticatedRequest;

      const result = authController.getProfile(req);

      expect(result).toEqual(mockJwtPayload);
      expect(result.sub).toBe('00000000-0000-0000-0000-000000000000');
      expect(result.username).toBe('testuser');
      expect(result.jwtId).toBe('mock-jwt-id');
    });

    it('should return a different payload for a different authenticated user', () => {
      const otherPayload: JwtPayload = {
        sub: '11111111-1111-1111-1111-111111111111',
        username: 'otheruser',
        jwtId: 'other-jwt-id',
        exp: Math.floor(Date.now() / 1000) + 3600,
      };
      const req = { user: otherPayload } as AuthenticatedRequest;

      const result = authController.getProfile(req);

      expect(result).toEqual(otherPayload);
    });
  });
});
