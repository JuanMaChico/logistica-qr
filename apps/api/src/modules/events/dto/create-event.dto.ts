import { IsString, IsEnum, IsOptional, MinLength, IsDateString, IsUUID, IsArray, ArrayMinSize } from 'class-validator';
import { EventType } from '@prisma/client';

export class CreateEventDto {
  @IsString()
  @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres' })
  name!: string;

  @IsEnum(EventType, { message: 'Tipo de evento inválido' })
  type!: EventType;

  @IsOptional()
  @IsUUID()
  clientId?: string;

  @IsString()
  @MinLength(2, { message: 'El nombre del cliente debe tener al menos 2 caracteres' })
  clientName!: string;

  @IsOptional()
  @IsString()
  clientPhone?: string;

  @IsOptional()
  @IsString()
  clientAddress?: string;

  @IsDateString({}, { message: 'Fecha de salida inválida' })
  departureDate!: string;

  @IsDateString({}, { message: 'Fecha de retorno inválida' })
  returnDate!: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  @ArrayMinSize(1)
  equipmentIds?: string[];
}
