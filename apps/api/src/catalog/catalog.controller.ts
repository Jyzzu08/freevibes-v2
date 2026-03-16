import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '@/common/decorators/public.decorator';
import { CatalogQueryDto } from './dto/catalog-query.dto';
import { CatalogService } from './catalog.service';

@ApiTags('catalog')
@Controller()
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get('genres')
  @Public()
  genres(@Query() query: CatalogQueryDto) {
    return this.catalogService.listGenres(query);
  }

  @Get('artists')
  @Public()
  artists(@Query() query: CatalogQueryDto) {
    return this.catalogService.listArtists(query);
  }

  @Get('artists/:slug')
  @Public()
  artist(@Param('slug') slug: string) {
    return this.catalogService.getArtist(slug);
  }

  @Get('albums')
  @Public()
  albums(@Query() query: CatalogQueryDto) {
    return this.catalogService.listAlbums(query);
  }

  @Get('albums/:slug')
  @Public()
  album(@Param('slug') slug: string) {
    return this.catalogService.getAlbum(slug);
  }

  @Get('tracks')
  @Public()
  tracks(@Query() query: CatalogQueryDto) {
    return this.catalogService.listTracks(query);
  }

  @Get('playlists/public')
  @Public()
  playlists(@Query() query: CatalogQueryDto) {
    return this.catalogService.listPublicPlaylists(query);
  }

  @Get('playlists/public/:slug')
  @Public()
  playlist(@Param('slug') slug: string) {
    return this.catalogService.getPublicPlaylist(slug);
  }
}
