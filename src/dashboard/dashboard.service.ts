import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Application } from '../application/entity/application.entity';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Application) private repo: Repository<Application>,
  ) {}

  async summary() {
    const total = await this.repo.count();

    // группировки
    const byCourse = await this.repo
      .createQueryBuilder('a')
      .select('a.course', 'course')
      .addSelect('COUNT(*)', 'count')
      .groupBy('a.course')
      .orderBy('count', 'DESC')
      .getRawMany();

    const byFaculty = await this.repo
      .createQueryBuilder('a')
      .select('a.faculty', 'faculty')
      .addSelect('COUNT(*)', 'count')
      .groupBy('a.faculty')
      .orderBy('count', 'DESC')
      .getRawMany();

    const bySocial = await this.repo
      .createQueryBuilder('a')
      .select('a.socialCategory', 'socialCategory')
      .addSelect('COUNT(*)', 'count')
      .groupBy('a.socialCategory')
      .orderBy('count', 'DESC')
      .getRawMany();

    // последние 7 дней по дням
    const since = new Date();
    since.setDate(since.getDate() - 6); // today-6 → всего 7 дней

    const last7 = await this.repo
      .createQueryBuilder('a')
      .select("TO_CHAR(a.createdAt, 'YYYY-MM-DD')", 'day')
      .addSelect('COUNT(*)', 'count')
      .where('a.createdAt >= :since', { since })
      .groupBy("TO_CHAR(a.createdAt, 'YYYY-MM-DD')")
      .orderBy('day', 'ASC')
      .getRawMany();

    return {
      total,
      byCourse,
      byFaculty,
      bySocial,
      last7,
    };
  }
}
