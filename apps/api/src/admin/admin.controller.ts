import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { RoleKey } from '@prisma/client';
import { Roles } from '@/common/decorators/roles.decorator';
import { AdminService } from './admin.service';
import { CreateAlbumDto } from './dto/create-album.dto';
import { CreateArtistDto } from './dto/create-artist.dto';
import { CreateGenreDto } from './dto/create-genre.dto';
import { CreateTrackDto } from './dto/create-track.dto';
import { UpdateAlbumDto } from './dto/update-album.dto';
import { UpdateArtistDto } from './dto/update-artist.dto';
import { UpdateGenreDto } from './dto/update-genre.dto';
import { UpdateTrackDto } from './dto/update-track.dto';

@ApiTags('admin')
@Roles(RoleKey.ADMIN)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('bootstrap')
  bootstrap() {
    return this.adminService.getBootstrap();
  }

  @Post('genres')
  createGenre(@Body() dto: CreateGenreDto) {
    return this.adminService.createGenre(dto);
  }

  @Patch('genres/:genreId')
  updateGenre(@Param('genreId') genreId: string, @Body() dto: UpdateGenreDto) {
    return this.adminService.updateGenre(genreId, dto);
  }

  @Delete('genres/:genreId')
  deleteGenre(@Param('genreId') genreId: string) {
    return this.adminService.deleteGenre(genreId);
  }

  @Post('artists')
  createArtist(@Body() dto: CreateArtistDto) {
    return this.adminService.createArtist(dto);
  }

  @Patch('artists/:artistId')
  updateArtist(
    @Param('artistId') artistId: string,
    @Body() dto: UpdateArtistDto,
  ) {
    return this.adminService.updateArtist(artistId, dto);
  }

  @Delete('artists/:artistId')
  deleteArtist(@Param('artistId') artistId: string) {
    return this.adminService.deleteArtist(artistId);
  }

  @Post('albums')
  createAlbum(@Body() dto: CreateAlbumDto) {
    return this.adminService.createAlbum(dto);
  }

  @Patch('albums/:albumId')
  updateAlbum(@Param('albumId') albumId: string, @Body() dto: UpdateAlbumDto) {
    return this.adminService.updateAlbum(albumId, dto);
  }

  @Delete('albums/:albumId')
  deleteAlbum(@Param('albumId') albumId: string) {
    return this.adminService.deleteAlbum(albumId);
  }

  @Post('tracks')
  createTrack(@Body() dto: CreateTrackDto) {
    return this.adminService.createTrack(dto);
  }

  @Patch('tracks/:trackId')
  updateTrack(@Param('trackId') trackId: string, @Body() dto: UpdateTrackDto) {
    return this.adminService.updateTrack(trackId, dto);
  }

  @Delete('tracks/:trackId')
  deleteTrack(@Param('trackId') trackId: string) {
    return this.adminService.deleteTrack(trackId);
  }
}
