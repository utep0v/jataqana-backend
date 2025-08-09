import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { v4 as uuid } from 'uuid';
import { ApplicationService } from './application.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { existsSync, mkdirSync } from 'fs';
import { QueryApplicationDto } from './dto/query-application.dto';

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

@Controller('application')
export class ApplicationController {
  constructor(private service: ApplicationService) {}

  // Поле файла в форме: 'socialDoc'
  @Post()
  @UseInterceptors(
    FileInterceptor('socialDoc', {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          const dest = join(process.cwd(), 'public', 'uploads', 'social');
          if (!existsSync(dest)) {
            mkdirSync(dest, { recursive: true });
          }
          cb(null, dest);
        },
        filename: (_req, file, cb) => {
          cb(null, `${uuid()}${extname(file.originalname)}`);
        },
      }),
      limits: { fileSize: MAX_FILE_SIZE },
      fileFilter: (_req, file, cb) => {
        if (!ALLOWED.includes(file.mimetype)) {
          return cb(new Error('Бұл файл түріне рұқсат жоқ'), false);
        }
        cb(null, true);
      },
    }),
  )
  async create(
    @Body() dto: CreateApplicationDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const socialDocPath = file
      ? `public/uploads/social/${file.filename}`
      : undefined;
    const saved = await this.service.create(dto, socialDocPath);
    return { id: saved.id, createdAt: saved.createdAt };
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
