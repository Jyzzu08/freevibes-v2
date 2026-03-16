import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '@/auth/auth.types';
import { RecordPlaybackDto } from './dto/record-playback.dto';
import { PlaybackService } from './playback.service';

@ApiTags('playback')
@Controller('playback')
export class PlaybackController {
  constructor(private readonly playbackService: PlaybackService) {}

  @Post('history')
  record(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: RecordPlaybackDto,
  ) {
    return this.playbackService.record(user.id, dto);
  }
}
