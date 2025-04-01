import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateUserDto) {
    return this.prisma.user.create({
      data: {
        email: dto.email,
        password_hash: await hashPassword(dto.password),
        role: dto.role || 'CUSTOMER',
      },
    });
  }

  async reserveFunds(userId: string, amount: number) {
    // Проверка баланса и резервирование средств
  }
}