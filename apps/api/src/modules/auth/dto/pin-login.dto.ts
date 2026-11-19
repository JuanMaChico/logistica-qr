import { IsString, Length, Matches } from 'class-validator';

export class PinLoginDto {
  @IsString()
  @Length(4, 4, { message: 'El PIN debe tener exactamente 4 dígitos' })
  @Matches(/^\d{4}$/, { message: 'El PIN debe tener exactamente 4 dígitos' })
  pin!: string;
}
