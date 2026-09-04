import { IsOptional, IsUUID } from 'class-validator';

export class UpdateEventDto {
  name?: string;
  type?: string;
  clientName?: string;
  clientPhone?: string;
  clientAddress?: string;
  departureDate?: string;
  returnDate?: string;
  notes?: string;

  @IsOptional()
  @IsUUID()
  clientId?: string | null;
}
