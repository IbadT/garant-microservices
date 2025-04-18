import { Controller, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto, LoginResponseDto } from './dto';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Аутентификация')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Вход в систему', description: 'Аутентификация пользователя по email и паролю' })
  @ApiResponse({ status: 200, description: 'Успешная аутентификация', type: LoginResponseDto })
  @ApiResponse({ status: 400, description: 'Неверный запрос - отсутствуют обязательные поля' })
  @ApiResponse({ status: 401, description: 'Неверные учетные данные' })
  async login(@Body() loginDto: LoginDto): Promise<LoginResponseDto> {
    try {
      return await this.authService.login(loginDto);
    } catch (error) {
      if (error.message === 'Email and password are required') {
        throw new HttpException('Email and password are required', HttpStatus.BAD_REQUEST);
      }
      if (error.message === 'Invalid credentials') {
        throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);
      }
      throw new HttpException('Internal server error', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
} 