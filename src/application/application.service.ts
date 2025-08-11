import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {Repository } from 'typeorm';
import * as ExcelJS from 'exceljs';
import { existsSync, mkdirSync } from 'fs';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { Application } from './entity/application.entity';
import { CreateApplicationDto } from './dto/create-application.dto';

@Injectable()
export class ApplicationService {
  constructor(
    @InjectRepository(Application)
    private repo: Repository<Application>,
  ) {}

  async create(dto: CreateApplicationDto, socialDocPaths?: string[]) {
    const campaignYear = dto.campaignYear ?? new Date().getFullYear();
    const entity = this.repo.create({ ...dto, campaignYear, socialDocPaths });

    try {
      return await this.repo.save(entity);
    } catch (e: any) {
      // Postgres unique violation
      if (e?.code === '23505') {
        throw new ConflictException('Заявка с этим ИИН уже отправлена.');
      }
      throw e;
    }
  }

  async findPagedAndFiltered(q: {
    page: number;
    size: number;
    course?: string;
    faculty?: string;
    socialCategory?: string;
  }) {
    const { page = 1, size = 10, course, faculty, socialCategory } = q;

    const where: any = {};
    if (course) where.course = course;
    if (faculty) where.faculty = faculty;
    if (socialCategory) where.socialCategory = socialCategory;

    const [items, total] = await this.repo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * size,
      take: size,
    });

    return { items, page, size, total };
  }

  async exportToExcelPublic(filter?: {
    course?: string;
    faculty?: string;
    socialCategory?: string;
  }) {
    const where: any = {};
    if (filter?.course) where.course = filter.course;
    if (filter?.faculty) where.faculty = filter.faculty;
    if (filter?.socialCategory) where.socialCategory = filter.socialCategory;

    const rows = await this.repo.find({ where, order: { createdAt: 'DESC' } });

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Өтінімдер');

    ws.columns = [
      { header: 'ID', key: 'id', width: 36 },
      { header: 'Толық аты-жөні', key: 'fio', width: 32 },
      { header: 'ЖСН', key: 'iin', width: 16 },
      { header: 'Электронды поштасы', key: 'email', width: 28 },
      { header: 'Телефон номері', key: 'phone', width: 20 },
      { header: 'Оқу курсы', key: 'course', width: 16 },
      { header: 'Факультеті', key: 'faculty', width: 24 },
      { header: 'Әлеуметтік санаты', key: 'socialCategory', width: 24 },
      // 5 отдельных колонок с гиперссылками
      { header: 'Құжат 1', key: 'doc1', width: 28 },
      { header: 'Құжат 2', key: 'doc2', width: 28 },
      { header: 'Құжат 3', key: 'doc3', width: 28 },
      { header: 'Құжат 4', key: 'doc4', width: 28 },
      { header: 'Құжат 5', key: 'doc5', width: 28 },
      { header: 'Тапсырылған күні', key: 'createdAt', width: 22 },
    ];

    for (const r of rows) {
      const fio = [r.lastName, r.firstName, r.middleName]
        .filter(Boolean)
        .join(' ');
      const urls = (r.socialDocPaths ?? [])
        .slice(0, 5)
        .map((p) => `${process.env.BASE_URL}/${p.replace(/^\/+/, '')}`);

      const row = ws.addRow({
        id: r.id,
        fio,
        iin: r.iin,
        email: r.email ?? '',
        phone: r.phone,
        course: r.course,
        faculty: r.faculty,
        socialCategory: r.socialCategory,
        createdAt: r.createdAt.toISOString().replace('T', ' ').slice(0, 19),
      });

      // Гиперссылки
      urls.forEach((u, idx) => {
        const key = `doc${idx + 1}` as const;
        const cell = row.getCell(key);
        cell.value = { text: `Ашу ${idx + 1}`, hyperlink: u };
      });
    }

    const dir = join(process.cwd(), 'public', 'exports');
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

    const fileName = `applications_${Date.now()}.xlsx`;
    const absPath = join(dir, fileName);
    const publicUrl = `${process.env.BASE_URL}/public/exports/${fileName}`;

    const buffer = await wb.xlsx.writeBuffer();
    await writeFile(absPath, Buffer.from(buffer));
    return { publicUrl };
  }
}
