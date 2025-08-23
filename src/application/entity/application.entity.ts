import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Index(['iin', 'campaignYear'], { unique: true })
@Entity('application')
export class Application {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column()
  middleName: string;

  @Column({ length: 12 })
  iin: string;

  @Column({ type: 'smallint', default: () => 'EXTRACT(YEAR FROM NOW())' })
  campaignYear: number;

  @Column({ nullable: true })
  email?: string;

  @Column()
  phone: string;

  @Column()
  course: string;

  @Column()
  faculty: string;

  @Column()
  socialCategory: string;

  @Column('text', { array: true, nullable: true })
  socialDocPaths?: string[];

  @CreateDateColumn()
  createdAt: Date;

  @Column({ default: 'default' })
  type: string;
}
