import { IsDate, IsString, IsUUID } from 'class-validator';

export class UserDto {
  @IsString()
  username: string;

  @IsString()
  password: string;

  @IsUUID()
  uuid: string;

  @IsDate()
  createdAt: Date;

  @IsDate()
  updatedAt: Date;
}
