import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  fullName: string;

  @Index({ unique: true })
  @Column()
  email: string;

  @Column()
  passwordHash: string;

  @CreateDateColumn()
  createdAt: Date;
}
