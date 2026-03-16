import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Public } from '@/common/decorators/public.decorator';
import type { AuthenticatedUser } from '@/auth/auth.types';
import { OptionalAccessTokenGuard } from '@/common/guards/optional-access-token.guard';
import { AddPlaylistTrackDto } from './dto/add-playlist-track.dto';
import { CreatePlaylistDto } from './dto/create-playlist.dto';
import { ReorderPlaylistTracksDto } from './dto/reorder-playlist-tracks.dto';
import { UpdatePlaylistDto } from './dto/update-playlist.dto';
import { PlaylistsService } from './playlists.service';

@ApiTags('playlists')
@Controller('playlists')
export class PlaylistsController {
  constructor(private readonly playlistsService: PlaylistsService) {}

  @Get('mine')
  listMine(@CurrentUser() user: AuthenticatedUser) {
    return this.playlistsService.listMine(user.id);
  }

  @Get(':slug')
  @Public()
  @UseGuards(OptionalAccessTokenGuard)
  getBySlug(
    @Param('slug') slug: string,
    @CurrentUser() user?: AuthenticatedUser,
  ) {
    return this.playlistsService.getBySlug(slug, user?.id);
  }

  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreatePlaylistDto,
  ) {
    return this.playlistsService.create(user.id, dto);
  }

  @Patch(':playlistId')
  update(
    @Param('playlistId') playlistId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdatePlaylistDto,
  ) {
    return this.playlistsService.update(playlistId, user.id, dto);
  }

  @Delete(':playlistId')
  remove(
    @Param('playlistId') playlistId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.playlistsService.delete(playlistId, user.id);
  }

  @Post(':playlistId/tracks')
  addTrack(
    @Param('playlistId') playlistId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: AddPlaylistTrackDto,
  ) {
    return this.playlistsService.addTrack(playlistId, user.id, dto);
  }

  @Delete(':playlistId/tracks/:trackId')
  removeTrack(
    @Param('playlistId') playlistId: string,
    @Param('trackId') trackId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.playlistsService.removeTrack(playlistId, trackId, user.id);
  }

  @Patch(':playlistId/tracks/reorder')
  reorderTracks(
    @Param('playlistId') playlistId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ReorderPlaylistTracksDto,
  ) {
    return this.playlistsService.reorderTracks(playlistId, user.id, dto);
  }
}
