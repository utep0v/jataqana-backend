import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('application_access')
export class ApplicationAccess {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  type: string;

  @Column({ default: true })
  isOpen: boolean;
}