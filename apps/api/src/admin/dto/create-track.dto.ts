import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateTrackDto {
  @IsString()
  @MinLength(1)
  @MaxLength(140)
  title!: string;

  @IsInt()
  @Min(1)
  trackNumber!: number;

  @IsInt()
  @Min(1)
  durationSec!: number;

  @IsString()
  artistId!: string;

  @IsString()
  albumId!: string;

  @IsString()
  genreId!: string;

  @IsOptional()
  @IsString()
  audioAssetId?: string;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}
