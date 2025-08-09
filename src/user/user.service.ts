import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from './entity/user.entity';

@Injectable()
export class UserService {
  constructor(@InjectRepository(User) private repo: Repository<User>) {}

  findByEmail(email: string) {
    return this.repo.findOne({ where: { email } });
  }

  findById(id: string): Promise<User | null> {
    return this.repo.findOne({ where: { id } });
  }

  async create(fullName: string, email: string, password: string) {
    const salt = parseInt(process.env.BCRYPT_SALT ?? '10', 10);
    const passwordHash = await bcrypt.hash(password, salt);
    const user = this.repo.create({ fullName, email, passwordHash });
    return this.repo.save(user);
  }

  async validate(email: string, password: string) {
    const user = await this.findByEmail(email);
    if (!user) return null;
    const ok = await bcrypt.compare(password, user.passwordHash);
    return ok ? user : null;
  }
}
