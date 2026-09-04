import { IsOptional, IsString, MinLength } from 'class-validator';

export class RetireEquipmentDto {
  @IsString()
  @MinLength(10, { message: 'El motivo debe tener al menos 10 caracteres' })
  reason!: string;

  @IsOptional()
  @IsString()
  eventId?: string;
}
