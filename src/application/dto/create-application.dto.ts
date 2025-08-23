import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Length,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateApplicationDto {
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsString()
  @IsNotEmpty()
  middleName: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(2024)
  @Max(2100)
  campaignYear?: number;

  @Matches(/^\d{12}$/, { message: 'ЖСН 12 цифр болуы керек' })
  @Length(12, 12)
  iin: string;

  @IsOptional()
  @IsEmail({}, { message: 'Дұрыс email енгізіңіз' })
  email?: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^[\d+()\-\s]{6,20}$/, { message: 'Телефон форматы қате' })
  phone: string;

  @IsString()
  @IsNotEmpty()
  course: string;

  @IsString()
  @IsNotEmpty()
  faculty: string;

  @IsString()
  @IsNotEmpty()
  socialCategory: string;

  @IsOptional()
  @IsString()
  type?: string;
}
