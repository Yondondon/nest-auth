import { Controller, Delete, Param } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Delete(':id')
  async removeUser(@Param('id') id: string): Promise<void> {
    await this.usersService.remove(id);
  }
}
