import { IsString } from 'class-validator';

export class signInResponseDto {
  @IsString()
  accessToken: string;
}
