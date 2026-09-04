import { IsString, IsEnum, IsOptional, MinLength } from 'class-validator';
import { EquipmentCategory } from '@prisma/client';

export class CreateEquipmentDto {
  @IsString()
  @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres' })
  name!: string;

  @IsEnum(EquipmentCategory, { message: 'Categoría inválida' })
  category!: EquipmentCategory;

  @IsOptional()
  @IsString()
  notes?: string;
}
