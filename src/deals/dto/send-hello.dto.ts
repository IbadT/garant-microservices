import { IsString, IsNotEmpty, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendHelloDto {
  @ApiProperty({
    description: 'Message to send',
    example: 'Hello, world!',
    minLength: 1,
    maxLength: 100
  })
  @IsString()
  @IsNotEmpty({ message: 'Message cannot be empty' })
  @MinLength(1, { message: 'Message must be at least 1 character long' })
  @MaxLength(100, { message: 'Message cannot be longer than 100 characters' })
  message: string;
} 