import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Application } from '../application/entity/application.entity';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Application) private repo: Repository<Application>,
  ) {}

  async summary(type?: string) {
    const where: any = {};
    if (type) where.type = type;

    const total = await this.repo.count({ where });

    // группировки
    const byCourse = await this.repo
      .createQueryBuilder('a')
      .select('a.course', 'course')
      .addSelect('COUNT(*)', 'count')
      .where(type ? 'a.type = :type' : '1=1', { type })
      .groupBy('a.course')
      .orderBy('count', 'DESC')
      .getRawMany();

    const byFaculty = await this.repo
      .createQueryBuilder('a')
      .select('a.faculty', 'faculty')
      .addSelect('COUNT(*)', 'count')
      .where(type ? 'a.type = :type' : '1=1', { type })
      .groupBy('a.faculty')
      .orderBy('count', 'DESC')
      .getRawMany();

    const bySocial = await this.repo
      .createQueryBuilder('a')
      .select('a.socialCategory', 'socialCategory')
      .addSelect('COUNT(*)', 'count')
      .where(type ? 'a.type = :type' : '1=1', { type })
      .groupBy('a.socialCategory')
      .orderBy('count', 'DESC')
      .getRawMany();

    const byGender = await this.repo
      .createQueryBuilder('a')
      .select(`COALESCE(a.gender, 'unknown')`, 'gender')
      .addSelect('COUNT(*)', 'count')
      .where(type ? 'a.type = :type' : '1=1', { type })
      .groupBy(`COALESCE(a.gender, 'unknown')`)
      .orderBy('count', 'DESC')
      .getRawMany();

    const since = new Date();
    since.setDate(since.getDate() - 6);

    const last7 = await this.repo
      .createQueryBuilder('a')
      .select("TO_CHAR(a.createdAt, 'YYYY-MM-DD')", 'day')
      .addSelect('COUNT(*)', 'count')
      .where('a.createdAt >= :since', { since })
      .andWhere(type ? 'a.type = :type' : '1=1', { type })
      .groupBy("TO_CHAR(a.createdAt, 'YYYY-MM-DD')")
      .orderBy('day', 'ASC')
      .getRawMany();

    return {
      total,
      byCourse,
      byFaculty,
      bySocial,
      byGender,
      last7,
    };
  }
}
