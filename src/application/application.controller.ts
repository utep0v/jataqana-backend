import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { v4 as uuid } from 'uuid';
import { ApplicationService } from './application.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { existsSync, mkdirSync } from 'fs';
import { QueryApplicationDto } from './dto/query-application.dto';

@Controller('application')
export class ApplicationController {
  constructor(private service: ApplicationService) {}

  @UseInterceptors(
    FilesInterceptor('socialDocs', 5, {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          const dest = join(process.cwd(), 'public', 'uploads', 'social');
          if (!existsSync(dest)) mkdirSync(dest, { recursive: true });
          cb(null, dest);
        },
        filename: (_req, file, cb) =>
          cb(null, `${uuid()}${extname(file.originalname)}`),
      }),
      limits: { fileSize: 10 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        const ok = [
          'application/pdf',
          'image/png',
          'image/jpeg',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ].includes(file.mimetype);
        cb(ok ? null : new Error('Бұл файл түріне рұқсат жоқ'), ok);
      },
    }),
  )
  @Post()
  async create(
    @Body() dto: CreateApplicationDto,
    @UploadedFiles() files: Express.Multer.File[] = [],
  ) {
    const paths = files.map((f) => `public/uploads/social/${f.filename}`);
    const saved = await this.service.create(dto, paths); // см. сервис ниже
  }

  @Get()
  findPaged(@Query() query: QueryApplicationDto) {
    return this.service.findPagedAndFiltered({
      page: query.page ?? 1,
      size: query.size ?? 10,
      course: query.course, // undefined если пусто
      faculty: query.faculty,
      socialCategory: query.socialCategory,
    });
  }

  @Post('export')
  async export(@Query() query: QueryApplicationDto) {
    const { publicUrl } = await this.service.exportToExcelPublic({
      course: query.course,
      faculty: query.faculty,
      socialCategory: query.socialCategory,
    });
    return { url: publicUrl };
  }
}
