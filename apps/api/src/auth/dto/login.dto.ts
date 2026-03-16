import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty()
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  emailOrUsername!: string;

  @ApiProperty()
  @IsString()
  @MinLength(8)
  @MaxLength(64)
  password!: string;
}
