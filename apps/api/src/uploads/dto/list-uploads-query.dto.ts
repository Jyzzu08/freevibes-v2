import { ApiPropertyOptional } from '@nestjs/swagger';
import { AssetKind } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';

export class ListUploadsQueryDto {
  @ApiPropertyOptional({ enum: AssetKind })
  @IsOptional()
  @IsEnum(AssetKind)
  kind?: AssetKind;
}
