import { Controller, Delete, Get, Param, Query } from '@nestjs/common';
import { UsersService } from './users.service';
import { PaginationDto, UserDto } from '../dto/users';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async find(@Query() pagination: PaginationDto): Promise<UserDto[]> {
    return this.usersService.find(pagination);
  }

  @Delete(':id')
  async removeUser(@Param('id') id: string): Promise<void> {
    await this.usersService.remove(id);
  }
}
