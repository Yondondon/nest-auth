import { Body, Controller, Delete, Param, Post } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from '../dto/users';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  async createUser(@Body() createUserDto: CreateUserDto): Promise<string> {
    return await this.usersService.create(createUserDto);
  }

  @Delete(':id')
  async removeUser(@Param('id') id: string): Promise<void> {
    await this.usersService.remove(id);
  }
}
