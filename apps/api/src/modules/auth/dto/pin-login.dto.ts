import { IsString, Length } from 'class-validator';

export class PinLoginDto {
  @IsString()
  @Length(4, 4, { message: 'El PIN debe tener exactamente 4 dígitos' })
  pin!: string;
}
