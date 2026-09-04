import { IsString, IsOptional, IsEnum } from 'class-validator';
import { ReturnCondition } from '@prisma/client';

export class CheckinDto {
  @IsString()
  equipmentId!: string;

  @IsOptional()
  @IsEnum(ReturnCondition, { message: 'Condición inválida' })
  condition?: ReturnCondition;

  @IsOptional()
  @IsString()
  notes?: string;
}
