import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class AddPlaylistTrackDto {
  @ApiProperty()
  @IsString()
  trackId!: string;
}
