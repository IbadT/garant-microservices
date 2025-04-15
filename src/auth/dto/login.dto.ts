import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO для входа в систему
 */
export class LoginDto {
  /**
   * Email пользователя
   * @example user@example.com
   */
  @ApiProperty({
    description: 'Email пользователя',
    example: 'admin@example.com',
  })
  @IsEmail({}, { message: 'Некорректный формат email' })
  @IsNotEmpty({ message: 'Email обязателен' })
  email: string;

  /**
   * Пароль пользователя
   * @example password123
   */
  @ApiProperty({
    description: 'Пароль пользователя',
    example: 'password123',
  })
  @IsString({ message: 'Пароль должен быть строкой' })
  @IsNotEmpty({ message: 'Пароль обязателен' })
  @MinLength(6, { message: 'Пароль должен содержать минимум 6 символов' })
  password: string;
} 