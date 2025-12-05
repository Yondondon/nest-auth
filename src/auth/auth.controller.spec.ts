import { Test } from '@nestjs/testing';
import {
  HttpException,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { signInDto, signInResponseDto } from '../dto/auth';
import { AuthenticatedRequest, JwtPayload } from '../interfaces';

describe('AuthController', () => {
  let authController: AuthController;
  let authService: AuthService;

  const mockSignInDto: signInDto = {
    username: 'testuser',
    password: 'password123',
  };

  const mockSignInResponse: signInResponseDto = {
    accessToken: 'mock-jwt-token',
  };

  const mockJwtPayload: JwtPayload = {
    sub: '00000000-0000-0000-0000-000000000000',
    username: 'testuser',
  };

  const mockAuthenticatedRequest = {
    user: mockJwtPayload,
  } as AuthenticatedRequest;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            findOneBy: jest.fn(),
            create: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn(),
          },
        },
      ],
    }).compile();

    authController = moduleRef.get<AuthController>(AuthController);
    authService = moduleRef.get<AuthService>(AuthService);
  });

  describe('signIn', () => {
    it('should return access token on successful sign in', async () => {
      const signInSpy = jest
        .spyOn(authService, 'signIn')
        .mockResolvedValue(mockSignInResponse);

      const result = await authController.signIn(mockSignInDto);

      expect(result).toEqual(mockSignInResponse);
      expect(result.accessToken).toBe('mock-jwt-token');
      expect(signInSpy).toHaveBeenCalledWith(
        mockSignInDto.username,
        mockSignInDto.password,
      );
      expect(signInSpy).toHaveBeenCalledTimes(1);
    });

    it('should throw UnauthorizedException when credentials are invalid', async () => {
      const error = new UnauthorizedException();
      const signInSpy = jest
        .spyOn(authService, 'signIn')
        .mockRejectedValue(error);

      await expect(authController.signIn(mockSignInDto)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(signInSpy).toHaveBeenCalledWith(
        mockSignInDto.username,
        mockSignInDto.password,
      );
      expect(signInSpy).toHaveBeenCalledTimes(1);
    });

    it('should propagate service errors', async () => {
      const error = new HttpException(
        'User does not exist',
        HttpStatus.BAD_REQUEST,
      );
      const signInSpy = jest
        .spyOn(authService, 'signIn')
        .mockRejectedValue(error);

      await expect(authController.signIn(mockSignInDto)).rejects.toThrow(error);
      expect(signInSpy).toHaveBeenCalledWith(
        mockSignInDto.username,
        mockSignInDto.password,
      );
      expect(signInSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('signUp', () => {
    it('should return user uuid on successful sign up', async () => {
      const mockUuid = '00000000-0000-0000-0000-000000000000';
      const signUpSpy = jest
        .spyOn(authService, 'signUp')
        .mockResolvedValue(mockUuid);

      const result = await authController.signUp(mockSignInDto);

      expect(result).toBe(mockUuid);
      expect(signUpSpy).toHaveBeenCalledWith(
        mockSignInDto.username,
        mockSignInDto.password,
      );
      expect(signUpSpy).toHaveBeenCalledTimes(1);
    });

    it('should throw error when user already exists', async () => {
      const error = new HttpException(
        'User already exists',
        HttpStatus.BAD_REQUEST,
      );
      const signUpSpy = jest
        .spyOn(authService, 'signUp')
        .mockRejectedValue(error);

      await expect(authController.signUp(mockSignInDto)).rejects.toThrow(error);
      expect(signUpSpy).toHaveBeenCalledWith(
        mockSignInDto.username,
        mockSignInDto.password,
      );
      expect(signUpSpy).toHaveBeenCalledTimes(1);
    });

    it('should propagate service errors', async () => {
      const error = new HttpException(
        'Database error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );

      const signUpSpy = jest
        .spyOn(authService, 'signUp')
        .mockRejectedValue(error);

      await expect(authController.signUp(mockSignInDto)).rejects.toThrow(error);
      expect(signUpSpy).toHaveBeenCalledWith(
        mockSignInDto.username,
        mockSignInDto.password,
      );
      expect(signUpSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('getProfile', () => {
    it('should return user payload from request', () => {
      const result = authController.getProfile(mockAuthenticatedRequest);

      expect(result).toEqual(mockJwtPayload);
      expect(result.sub).toBe('00000000-0000-0000-0000-000000000000');
      expect(result.username).toBe('testuser');
    });

    it('should return different user payload when different user is authenticated', () => {
      const differentUser = {
        user: {
          sub: '11111111-1111-1111-1111-111111111111',
          username: 'differentuser',
        },
      } as AuthenticatedRequest;

      const result = authController.getProfile(differentUser);

      expect(result).toEqual(differentUser.user);
      expect(result.sub).toBe('11111111-1111-1111-1111-111111111111');
      expect(result.username).toBe('differentuser');
    });
  });
});
