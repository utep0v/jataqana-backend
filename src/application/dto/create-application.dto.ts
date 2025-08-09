import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Length,
} from 'class-validator';

export class CreateApplicationDto {
  // Студенттің аты-жөні
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsString()
  @IsNotEmpty()
  middleName: string;

  // ЖСН: ровно 12 цифр
  @Matches(/^\d{12}$/, { message: 'ЖСН 12 цифр болуы керек' })
  @Length(12, 12)
  iin: string;

  // Электронды поштасы
  @IsOptional()
  @IsEmail({}, { message: 'Дұрыс email енгізіңіз' })
  email?: string;

  // Телефон номері (простая проверка, можно усилить под KZ)
  @IsString()
  @IsNotEmpty()
  @Matches(/^[\d+()\-\s]{6,20}$/, { message: 'Телефон форматы қате' })
  phone: string;

  // Оқу курсы
  @IsString()
  @IsNotEmpty()
  course: string;

  // Факультеті
  @IsString()
  @IsNotEmpty()
  faculty: string;

  // Әлеуметтік санаты
  @IsString()
  @IsNotEmpty()
  socialCategory: string;
}
