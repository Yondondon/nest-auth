import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { HttpException, HttpStatus } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UserDto } from '../dto/users';
import { UserEntity } from '../entities/user';

describe('UsersController', () => {
  let usersController: UsersController;
  let usersService: UsersService;

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
        UsersService,
        {
          provide: getRepositoryToken(UserEntity),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            save: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    usersService = moduleRef.get<UsersService>(UsersService);
    usersController = moduleRef.get<UsersController>(UsersController);
  });

  describe('findAll', () => {
    it('should return an array of users', async () => {
      const result: UserDto[] = [mockUserDto, mockUserDto2];
      jest.spyOn(usersService, 'findAll').mockResolvedValue(result);

      const response = await usersController.findAll();

      expect(response).toBe(result);
      expect(response).toHaveLength(2);
      expect(response[0]).toEqual(mockUserDto);
      expect(response[1]).toEqual(mockUserDto2);
      expect(usersService.findAll).toHaveBeenCalledTimes(1);
    });

    it('should return an empty array when no users exist', async () => {
      const result: UserDto[] = [];
      jest.spyOn(usersService, 'findAll').mockResolvedValue(result);

      const response = await usersController.findAll();

      expect(response).toBe(result);
      expect(response).toHaveLength(0);
      expect(usersService.findAll).toHaveBeenCalledTimes(1);
    });

    it('should propagate service errors', async () => {
      const error = new HttpException(
        'Database error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
      jest.spyOn(usersService, 'findAll').mockRejectedValue(error);

      await expect(usersController.findAll()).rejects.toThrow(error);
      expect(usersService.findAll).toHaveBeenCalledTimes(1);
    });
  });

  describe('removeUser', () => {
    it('should successfully remove a user', async () => {
      const userId = '00000000-0000-0000-0000-000000000000';
      jest.spyOn(usersService, 'remove').mockResolvedValue(undefined);

      await usersController.removeUser(userId);

      expect(usersService.remove).toHaveBeenCalledWith(userId);
      expect(usersService.remove).toHaveBeenCalledTimes(1);
    });

    it('should throw an error when user does not exist', async () => {
      const userId = 'non-existent-uuid';
      const error = new HttpException(
        'User does not exist',
        HttpStatus.BAD_REQUEST,
      );
      jest.spyOn(usersService, 'remove').mockRejectedValue(error);

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
      jest.spyOn(usersService, 'remove').mockRejectedValue(error);

      await expect(usersController.removeUser(userId)).rejects.toThrow(error);
      expect(usersService.remove).toHaveBeenCalledWith(userId);
      expect(usersService.remove).toHaveBeenCalledTimes(1);
    });
  });
});
