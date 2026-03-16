import {
  Controller,
  Get,
  ParseFilePipeBuilder,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { ApiConsumes, ApiTags } from '@nestjs/swagger';
import { RoleKey } from '@prisma/client';
import { FileInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import type { AuthenticatedUser } from '@/auth/auth.types';
import { ListUploadsQueryDto } from './dto/list-uploads-query.dto';
import { UploadsService } from './uploads.service';

const MAX_IMAGE_SIZE = 12 * 1024 * 1024;
const MAX_AUDIO_SIZE = 25 * 1024 * 1024;

@ApiTags('uploads')
@Controller('upload-assets')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Get()
  listAssets(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListUploadsQueryDto,
  ) {
    return this.uploadsService.listAssets(user, query);
  }

  @Post('images')
  @Throttle({ default: { ttl: 60_000, limit: 20 } })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: MAX_IMAGE_SIZE },
    }),
  )
  uploadImage(
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({ fileType: /(jpg|jpeg|png|webp)$/i })
        .addMaxSizeValidator({ maxSize: MAX_IMAGE_SIZE })
        .build({ fileIsRequired: true }),
    )
    file: Express.Multer.File,
  ) {
    return this.uploadsService.uploadImage(file, user.id);
  }

  @Post('audio')
  @Roles(RoleKey.ADMIN)
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: MAX_AUDIO_SIZE },
    }),
  )
  uploadAudio(
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({
          fileType: /(mp3|mpeg|wav|x-wav|audio\/ogg|application\/ogg|ogg)$/i,
        })
        .addMaxSizeValidator({ maxSize: MAX_AUDIO_SIZE })
        .build({ fileIsRequired: true }),
    )
    file: Express.Multer.File,
  ) {
    return this.uploadsService.uploadAudio(file, user.id);
  }
}
