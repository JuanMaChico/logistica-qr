import { IsString, IsOptional } from 'class-validator';

export class CheckoutDto {
  @IsString()
  equipmentId!: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
