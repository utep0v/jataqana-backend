import { ConflictException, GoneException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as ExcelJS from 'exceljs';
import { existsSync, mkdirSync } from 'fs';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { Application } from './entity/application.entity';
import { CreateApplicationDto } from './dto/create-application.dto';
import { ApplicationAccess } from './entity/application-access.entity';

type FindFilter = {
  page: number;
  size: number;
  course?: string;
  faculty?: string;
  socialCategory?: string;
  search?: string;
  type?: string;
};

@Injectable()
export class ApplicationService {
  constructor(
    @InjectRepository(Application)
    private repo: Repository<Application>,
    @InjectRepository(ApplicationAccess)
    private accessRepo: Repository<ApplicationAccess>,
  ) {}

  async setAccess(type: string, isOpen: boolean) {
    let access = await this.accessRepo.findOne({ where: { type } });
    if (!access) {
      access = this.accessRepo.create({ type, isOpen });
    } else {
      access.isOpen = isOpen;
    }
    return this.accessRepo.save(access);
  }

  async checkAccess(type: string) {
    const access = await this.accessRepo.findOne({ where: { type } });
    if (!access || !access.isOpen) {
      throw new GoneException('Подача заявок для этого типа закрыта.');
    }
  }

  async getStatus(type: string) {
    const access = await this.accessRepo.findOne({ where: { type } });
    return { type, isOpen: access ? access.isOpen : true };
  }

  async create(dto: CreateApplicationDto, socialDocPaths?: string[]) {
    const campaignYear = dto.campaignYear ?? new Date().getFullYear();
    const type = dto.type ?? 'default';

    await this.checkAccess(type);

    const entity = this.repo.create({
      ...dto,
      campaignYear,
      type,
      socialDocPaths,
    });

    try {
      return await this.repo.save(entity);
    } catch (e: any) {
      if (e?.code === '23505') {
        throw new ConflictException(
          'Заявка с этим ИИН и типом на этот год уже отправлена.',
        );
      }
      throw e;
    }
  }

  private applyFilters(
    qb: ReturnType<typeof this.repo.createQueryBuilder>,
    f: Omit<FindFilter, 'page' | 'size'>,
  ) {
    if (f.course) qb.andWhere('a.course = :course', { course: f.course });
    if (f.faculty) qb.andWhere('a.faculty = :faculty', { faculty: f.faculty });
    if (f.socialCategory)
      qb.andWhere('a.socialCategory = :socialCategory', {
        socialCategory: f.socialCategory,
      });

    if (f.type) qb.andWhere('a.type = :type', { type: f.type });

    if (f.search) {
      const tokens = f.search
        .trim()
        .split(/[\s,]+/)
        .filter(Boolean);

      tokens.forEach((tok, i) => {
        const isDigits = /^\d+$/.test(tok);
        const param = `s${i}`;
        const val = `%${tok}%`;

        const ors: string[] = [
          `a.firstName ILIKE :${param}`,
          `a.lastName ILIKE :${param}`,
          `a.middleName ILIKE :${param}`,
        ];
        if (isDigits) {
          ors.push(`a.iin ILIKE :${param}`);
        } else {
          ors.push(`a.iin ILIKE :${param}`);
        }

        qb.andWhere(`(${ors.join(' OR ')})`, { [param]: val });
      });
    }
    return qb;
  }

  async findPagedAndFiltered(q: FindFilter) {
    const { page = 1, size = 10, ...rest } = q;

    const qb = this.repo.createQueryBuilder('a');
    this.applyFilters(qb, rest);

    qb.orderBy('a.createdAt', 'DESC')
      .skip((page - 1) * size)
      .take(size);

    const [items, total] = await qb.getManyAndCount();
    return { items, page, size, total };
  }

  async exportToExcelPublic(filter?: {
    course?: string;
    faculty?: string;
    socialCategory?: string;
    type?: string;
  }) {
    const where: any = {};
    if (filter?.course) where.course = filter.course;
    if (filter?.faculty) where.faculty = filter.faculty;
    if (filter?.socialCategory) where.socialCategory = filter.socialCategory;
    if (filter?.type) where.type = filter.type;

    const rows = await this.repo.find({ where, order: { createdAt: 'DESC' } });

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Өтінімдер');

    ws.columns = [
      { header: 'ID', key: 'id', width: 36 },
      { header: 'Толық аты-жөні', key: 'fio', width: 32 },
      { header: 'Жынысы', key: 'gender', width: 12 },
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
      const urls = (r.socialDocPaths ?? []).slice(0, 5).map((p) => {
        let cleanPath = p.replace(/^\.?\/*/, ''); // убираем ./ или /
        if (!cleanPath.startsWith('public/')) {
          cleanPath = 'public/' + cleanPath;
        }
        return `${process.env.BASE_URL}/${cleanPath}`;
      });

      const row = ws.addRow({
        id: r.id,
        fio,
        iin: r.iin,
        email: r.email ?? '',
        phone: r.phone,
        course: r.course,
        gender: r.gender,
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
