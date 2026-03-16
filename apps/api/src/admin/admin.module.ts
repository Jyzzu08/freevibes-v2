import { Module } from '@nestjs/common';
import { PrismaModule } from '@/prisma/prisma.module';
import { UploadsModule } from '@/uploads/uploads.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [PrismaModule, UploadsModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
