import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { UserDto } from '../dto/users';
import { JwtService } from '@nestjs/jwt';
import { signInResponseDto } from '../dto/auth';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async signIn(username: string, pass: string): Promise<signInResponseDto> {
    const user: UserDto = await this.usersService.findOneBy(
      'username',
      username,
    );

    const isMatch: boolean = await bcrypt.compare(pass, user?.password);

    if (!isMatch) {
      throw new UnauthorizedException();
    }

    const payload = { sub: user.uuid, username: user.username };

    return {
      accessToken: await this.jwtService.signAsync(payload),
    };
  }

  async signUp(username: string, password: string): Promise<any> {
    return await this.usersService.create({ username, password });
  }
}
