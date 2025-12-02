import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateUserDto } from '../dto/users';
import { UserEntity } from '../entities/user';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
  ) {}
  async create(user: CreateUserDto): Promise<string> {
    const userEntity = await this.userRepo.findOne({
      where: { username: user.username },
    });

    if (userEntity) {
      throw new HttpException('User already exists', HttpStatus.BAD_REQUEST);
    }

    const newUserData: Partial<UserEntity> = {
      username: user.username,
      password: user.password,
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
}
