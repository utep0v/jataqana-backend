import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

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

  // ЖСН (ИИН) — 12 цифр
  @Column({ length: 12 })
  iin: string;

  // Электронды поштасы
  @Column({ nullable: true })
  email?: string;

  // Телефон номері
  @Column()
  phone: string;

  // Оқу курсы (например: "1 курс", "2 курс" или число)
  @Column()
  course: string;

  // Факультеті
  @Column()
  faculty: string;

  // Әлеуметтік санаты (например: "көп балалы", "мүгедектік", и т.д.)
  @Column()
  socialCategory: string;

  // Әлеуметтік санатты растайтын құжат (путь к файлу)
  @Column({ nullable: true })
  socialDocPath?: string;

  @CreateDateColumn()
  createdAt: Date;
}
