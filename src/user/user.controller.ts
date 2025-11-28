import { Controller, Get } from '@nestjs/common';
import { UserService } from './user.service';

@Controller('user')
export class UsersController {
  constructor(private readonly userService: UserService) {}

  @Get()
  test() {
    return this.userService.test();
  }
}
