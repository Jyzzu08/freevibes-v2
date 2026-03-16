import { Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '@/auth/auth.types';
import { LibraryService } from './library.service';

@ApiTags('library')
@Controller('library')
export class LibraryController {
  constructor(private readonly libraryService: LibraryService) {}

  @Get('overview')
  overview(@CurrentUser() user: AuthenticatedUser) {
    return this.libraryService.getOverview(user.id);
  }

  @Post('tracks/:trackId/favorite')
  favoriteTrack(
    @CurrentUser() user: AuthenticatedUser,
    @Param('trackId') trackId: string,
  ) {
    return this.libraryService.favoriteTrack(user.id, trackId);
  }

  @Delete('tracks/:trackId/favorite')
  unfavoriteTrack(
    @CurrentUser() user: AuthenticatedUser,
    @Param('trackId') trackId: string,
  ) {
    return this.libraryService.unfavoriteTrack(user.id, trackId);
  }

  @Post('albums/:albumId/save')
  saveAlbum(
    @CurrentUser() user: AuthenticatedUser,
    @Param('albumId') albumId: string,
  ) {
    return this.libraryService.saveAlbum(user.id, albumId);
  }

  @Delete('albums/:albumId/save')
  unsaveAlbum(
    @CurrentUser() user: AuthenticatedUser,
    @Param('albumId') albumId: string,
  ) {
    return this.libraryService.unsaveAlbum(user.id, albumId);
  }

  @Post('artists/:artistId/follow')
  followArtist(
    @CurrentUser() user: AuthenticatedUser,
    @Param('artistId') artistId: string,
  ) {
    return this.libraryService.followArtist(user.id, artistId);
  }

  @Delete('artists/:artistId/follow')
  unfollowArtist(
    @CurrentUser() user: AuthenticatedUser,
    @Param('artistId') artistId: string,
  ) {
    return this.libraryService.unfollowArtist(user.id, artistId);
  }
}
