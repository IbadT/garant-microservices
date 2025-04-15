import { DealInitiator, DealStatus, DisputeStatus, PrismaClient, UserRole } from '@prisma/client';
import * as seedData from '../seed-data.json';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  // Очистка базы данных
  await prisma.$transaction([
    prisma.review.deleteMany(),
    prisma.dispute.deleteMany(),
    prisma.deal.deleteMany(),
    prisma.user.deleteMany(),
    prisma.commissionBalance.deleteMany(),
    prisma.commissionSettings.deleteMany(),
  ]);

  // Создание пользователей
  const customer = await prisma.user.create({
    data: {
      email: 'customer@example.com',
      password: await bcrypt.hash('password123', 10),
      role: UserRole.CUSTOMER,
      balance: 10000,
      reserved_balance: 0,
    },
  });

  const vendor = await prisma.user.create({
    data: {
      email: 'vendor@example.com',
      password: await bcrypt.hash('password123', 10),
      role: UserRole.VENDOR,
      balance: 5000,
      reserved_balance: 0,
    },
  });

  const admin = await prisma.user.create({
    data: {
      email: 'admin@example.com',
      password: await bcrypt.hash('password123', 10),
      role: UserRole.ADMIN,
      balance: 0,
      reserved_balance: 0,
    },
  });

  // Создание настроек комиссий
  const commissionSettings = await prisma.commissionSettings.create({
    data: {
      percentage: 5.0, // 5% комиссия
      min_amount: 100, // Минимальная комиссия 100 рублей
      is_active: true,
    },
  });

  // Создание начального баланса комиссий
  const commissionBalance = await prisma.commissionBalance.create({
    data: {
      amount: 0, // Начальный баланс комиссий
    },
  });

  // Создание сделки
  const deal = await prisma.deal.create({
    data: {
      customer_id: customer.id,
      vendor_id: vendor.id,
      amount: 1000,
      description: 'Тестовая сделка',
      status: DealStatus.PENDING,
      initiator: DealInitiator.CUSTOMER,
      funds_reserved: false,
      commission_amount: 100, // 5% от 1000 = 50, но минимальная комиссия 100
      commission_paid: false,
    },
  });

  // Создание спора
  const dispute = await prisma.dispute.create({
    data: {
      deal_id: deal.id,
      opened_by: customer.id,
      opened_by_role: UserRole.CUSTOMER,
      reason: 'Не выполнена работа',
      status: DisputeStatus.PENDING,
    },
  });

  // Создание отзыва
  const review = await prisma.review.create({
    data: {
      deal_id: deal.id,
      author_id: customer.id,
      target_id: vendor.id,
      rating: 3,
      comment: 'Нормальная работа',
    },
  });

  console.log('Seed data created successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 