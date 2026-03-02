import { Test } from '@nestjs/testing';
import { HttpException, HttpStatus } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { PaginationDto, UserDto } from '../dto/users';

describe('UsersController', () => {
  let usersController: UsersController;
  let usersService: jest.Mocked<UsersService>;

  const mockUserDto: UserDto = {
    username: 'testuser',
    password: 'hashedpassword',
    uuid: '00000000-0000-0000-0000-000000000000',
    createdAt: new Date('2025-12-03T17:12:13.248Z'),
    updatedAt: new Date('2025-12-03T17:12:13.248Z'),
  };

  const mockUserDto2: UserDto = {
    username: 'testuser2',
    password: 'hashedpassword2',
    uuid: '11111111-1111-1111-1111-111111111111',
    createdAt: new Date('2025-12-03T17:12:13.248Z'),
    updatedAt: new Date('2025-12-03T17:12:13.248Z'),
  };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: {
            find: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    usersController = moduleRef.get<UsersController>(UsersController);
    usersService = moduleRef.get(UsersService);

    jest.clearAllMocks();
  });

  describe('find', () => {
    it('should return an array of users', async () => {
      const pagination: PaginationDto = { limit: 20, offset: 0 };
      usersService.find.mockResolvedValue([mockUserDto, mockUserDto2]);

      const result = await usersController.find(pagination);

      expect(result).toEqual([mockUserDto, mockUserDto2]);
      expect(result).toHaveLength(2);
      expect(usersService.find).toHaveBeenCalledWith(pagination);
      expect(usersService.find).toHaveBeenCalledTimes(1);
    });

    it('should return an empty array when no users exist', async () => {
      const pagination: PaginationDto = { limit: 20, offset: 0 };
      usersService.find.mockResolvedValue([]);

      const result = await usersController.find(pagination);

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
      expect(usersService.find).toHaveBeenCalledWith(pagination);
      expect(usersService.find).toHaveBeenCalledTimes(1);
    });

    it('should propagate service errors', async () => {
      const pagination: PaginationDto = { limit: 20, offset: 0 };
      const error = new HttpException(
        'Database error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
      usersService.find.mockRejectedValue(error);

      await expect(usersController.find(pagination)).rejects.toThrow(error);
      expect(usersService.find).toHaveBeenCalledTimes(1);
    });
  });

  describe('removeUser', () => {
    it('should successfully remove a user', async () => {
      const userId = '00000000-0000-0000-0000-000000000000';
      usersService.remove.mockResolvedValue(undefined);

      await usersController.removeUser(userId);

      expect(usersService.remove).toHaveBeenCalledWith(userId);
      expect(usersService.remove).toHaveBeenCalledTimes(1);
    });

    it('should throw when user does not exist', async () => {
      const userId = 'non-existent-uuid';
      const error = new HttpException(
        'User does not exist',
        HttpStatus.BAD_REQUEST,
      );
      usersService.remove.mockRejectedValue(error);

      await expect(usersController.removeUser(userId)).rejects.toThrow(error);
      expect(usersService.remove).toHaveBeenCalledWith(userId);
      expect(usersService.remove).toHaveBeenCalledTimes(1);
    });

    it('should propagate service errors', async () => {
      const userId = '00000000-0000-0000-0000-000000000000';
      const error = new HttpException(
        'Database error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
      usersService.remove.mockRejectedValue(error);

      await expect(usersController.removeUser(userId)).rejects.toThrow(error);
      expect(usersService.remove).toHaveBeenCalledWith(userId);
      expect(usersService.remove).toHaveBeenCalledTimes(1);
    });
  });
});
