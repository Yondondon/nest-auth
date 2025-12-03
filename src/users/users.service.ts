import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateUserDto } from '../dto/users';
import { UserEntity } from '../entities/user';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { UserDto } from '../dto/users';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
  ) {}

  async create(user: CreateUserDto): Promise<string> {
    const saltOrRounds = 10;
    const userEntity = await this.userRepo.findOne({
      where: { username: user.username },
    });

    if (userEntity) {
      throw new HttpException('User already exists', HttpStatus.BAD_REQUEST);
    }

    const hash: string = await bcrypt.hash(user.password, saltOrRounds);
    const newUserData: Partial<UserEntity> = {
      username: user.username,
      password: hash,
    };

    const createdUser: UserEntity = await this.userRepo.save(newUserData);
    return createdUser.uuid;
  }

  async remove(uuid: string): Promise<void> {
    const userEntity = await this.userRepo.findOne({ where: { uuid } });

    if (!userEntity) {
      throw new HttpException('User does not exist', HttpStatus.BAD_REQUEST);
    }

    await this.userRepo.remove(userEntity);
  }

  async findOneBy<K extends keyof UserEntity>(
    column: K,
    value: UserEntity[K],
  ): Promise<UserDto> {
    const userEntity: UserEntity | null = await this.userRepo.findOne({
      where: { [column]: value } as FindOptionsWhere<UserEntity>,
    });

    if (!userEntity) {
      throw new HttpException('User does not exist', HttpStatus.BAD_REQUEST);
    }

    return {
      username: userEntity.username,
      password: userEntity.password,
      uuid: userEntity.uuid,
      createdAt: userEntity.createdAt,
      updatedAt: userEntity.updatedAt,
    };
  }

  async findAll(): Promise<UserDto[]> {
    const users: UserEntity[] = await this.userRepo.find();

    if (users.length === 0) return [];

    return users.map((item: UserEntity) => {
      return {
        username: item.username,
        password: item.password,
        uuid: item.uuid,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      };
    });
  }
}
