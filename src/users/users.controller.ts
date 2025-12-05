import { Controller, Delete, Get, Param } from '@nestjs/common';
import { UsersService } from './users.service';
import { UserDto } from '../dto/users';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async findAll(): Promise<UserDto[]> {
    return this.usersService.findAll();
  }

  @Delete(':id')
  async removeUser(@Param('id') id: string): Promise<void> {
    await this.usersService.remove(id);
  }
}
