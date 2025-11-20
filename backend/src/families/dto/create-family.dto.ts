import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateFamilyDto {
  @ApiProperty()
  @IsString()
  name: string;
}
