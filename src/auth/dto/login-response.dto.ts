import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO для ответа при успешной аутентификации
 */
export class LoginResponseDto {
  /**
   * JWT токен для доступа к защищенным ресурсам
   * @example eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   */
  @ApiProperty({
    description: 'JWT токен для доступа к защищенным ресурсам',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImFkbWluQGV4YW1wbGUuY29tIiwic3ViIjoiODIyMzVkNmYtNDdmMS00NTNjLTliOTctNmQxNDI0MzNlZDczIiwiaWF0IjoxNzQ0NzE0ODgyLCJleHAiOjE3NDQ4MDEyODJ9.SXVOUsePeKc5zA5O3ptv5Z4duaLttxgdKRKBSEBqcs8',
  })
  access_token: string;
} 