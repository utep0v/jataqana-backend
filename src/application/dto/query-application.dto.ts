import { IsInt, IsOptional, IsPositive, Min, IsString } from 'class-validator';
import { Type, Transform } from 'class-transformer';

const toUndefIfEmpty = () =>
  Transform(({ value }) => {
    if (value === null || value === undefined) return undefined;
    const s = String(value).trim();
    return s.length ? s : undefined;
  });

export class QueryApplicationDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  size?: number = 10;

  @IsOptional()
  @IsString()
  @toUndefIfEmpty()
  course?: string;

  @IsOptional()
  @IsString()
  @toUndefIfEmpty()
  faculty?: string;

  @IsOptional()
  @IsString()
  @toUndefIfEmpty()
  socialCategory?: string;
}
