import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AssetKind, Prisma, RoleKey, StorageProvider } from '@prisma/client';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '@/prisma/prisma.service';
import { createSlug } from '@/common/utils/slug.util';
import type { ListUploadsQueryDto } from './dto/list-uploads-query.dto';

const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const AUDIO_TYPES = new Set([
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/x-wav',
  'audio/ogg',
  'application/ogg',
]);

const MAX_IMAGE_SIZE = 12 * 1024 * 1024;
const MAX_AUDIO_SIZE = 25 * 1024 * 1024;

@Injectable()
export class UploadsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async listAssets(
    user: { id: string; role: RoleKey },
    query: ListUploadsQueryDto,
  ) {
    const where: Prisma.UploadedAssetWhereInput = {
      ...(query.kind ? { kind: query.kind } : {}),
      ...(user.role === RoleKey.ADMIN ? {} : { uploadedById: user.id }),
    };

    const assets = await this.prisma.uploadedAsset.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return assets.map((asset) => this.toAssetResponse(asset));
  }

  async uploadImage(file: Express.Multer.File, uploadedById: string) {
    this.assertFile(file, AssetKind.IMAGE);
    return this.storeFile(file, AssetKind.IMAGE, uploadedById);
  }

  async uploadAudio(file: Express.Multer.File, uploadedById: string) {
    this.assertFile(file, AssetKind.AUDIO);
    return this.storeFile(file, AssetKind.AUDIO, uploadedById);
  }

  async getAssetOrThrow(assetId: string, kind?: AssetKind) {
    const asset = await this.prisma.uploadedAsset.findUnique({
      where: { id: assetId },
    });

    if (!asset) {
      throw new NotFoundException('Asset not found');
    }

    if (kind && asset.kind !== kind) {
      throw new BadRequestException(`Asset must be of kind ${kind}`);
    }

    return asset;
  }

  private assertFile(file: Express.Multer.File | undefined, kind: AssetKind) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    if (kind === AssetKind.IMAGE) {
      if (!IMAGE_TYPES.has(file.mimetype)) {
        throw new BadRequestException(
          'Only JPG, PNG and WEBP images are allowed',
        );
      }
      if (file.size > MAX_IMAGE_SIZE) {
        throw new BadRequestException('Image exceeds the 12MB size limit');
      }
      return;
    }

    if (!AUDIO_TYPES.has(file.mimetype)) {
      throw new BadRequestException(
        'Only MP3, WAV and OGG audio files are allowed',
      );
    }
    if (file.size > MAX_AUDIO_SIZE) {
      throw new BadRequestException('Audio exceeds the 25MB size limit');
    }
  }

  private async storeFile(
    file: Express.Multer.File,
    kind: AssetKind,
    uploadedById: string,
  ) {
    const subdirectory = kind === AssetKind.AUDIO ? 'audio' : 'images';
    const extension =
      path.extname(file.originalname) || this.extensionFromMime(file.mimetype);
    const fileName = `${createSlug(path.parse(file.originalname).name) || kind.toLowerCase()}-${randomUUID()}${extension}`;
    const storageRoot = path.resolve(
      process.cwd(),
      'storage',
      'uploads',
      subdirectory,
    );
    const absolutePath = path.join(storageRoot, fileName);

    await fs.mkdir(storageRoot, { recursive: true });
    await fs.writeFile(absolutePath, file.buffer);

    const baseUrl =
      this.configService.get<string>('localStorageBaseUrl') ??
      this.configService.get<string>('LOCAL_STORAGE_BASE_URL') ??
      'http://localhost:3001/uploads';

    const publicUrl = `${baseUrl}/${subdirectory}/${fileName}`;
    const storagePath = `/uploads/${subdirectory}/${fileName}`;

    const asset = await this.prisma.uploadedAsset.create({
      data: {
        kind,
        provider: StorageProvider.LOCAL,
        originalName: file.originalname,
        storagePath,
        publicUrl,
        mimeType: file.mimetype,
        sizeBytes: file.size,
        uploadedById,
      },
    });

    return this.toAssetResponse(asset);
  }

  private extensionFromMime(mimeType: string) {
    if (mimeType.includes('png')) return '.png';
    if (mimeType.includes('webp')) return '.webp';
    if (mimeType.includes('ogg')) return '.ogg';
    if (mimeType.includes('mpeg') || mimeType.includes('mp3')) return '.mp3';
    if (mimeType.includes('wav')) return '.wav';
    return '.bin';
  }

  private toAssetResponse(asset: {
    id: string;
    kind: AssetKind;
    originalName: string;
    publicUrl: string;
    sizeBytes: number;
    mimeType: string;
    createdAt: Date;
  }) {
    return {
      id: asset.id,
      kind: asset.kind,
      originalName: asset.originalName,
      publicUrl: asset.publicUrl,
      sizeBytes: asset.sizeBytes,
      mimeType: asset.mimeType,
      createdAt: asset.createdAt.toISOString(),
    };
  }
}
