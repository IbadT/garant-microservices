import { DealInitiator, DealStatus, DisputeStatus, PrismaClient, UserRole } from '@prisma/client';
import * as seedData from '../seed-data.json';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  // Seed users
  for (const user of seedData.users) {
    const createdUser = await prisma.user.upsert({
      where: { id: user.id },
      update: {},
      create: {
        id: user.id,
        email: user.email,
        password_hash: user.password_hash,
        role: user.role as UserRole,
        balance: user.balance,
        reserved_balance: user.reserved_balance,
        created_at: user.created_at,
        updated_at: user.updated_at
      },
    });
    console.log(`Created user with id: ${createdUser.id}`);
  }

  // Seed deals
  for (const deal of seedData.deals) {
    const createdDeal = await prisma.deal.upsert({
      where: { id: deal.id },
      update: {},
      create: {
        id: deal.id,
        customer_id: deal.customer_id,
        vendor_id: deal.vendor_id,
        amount: deal.amount,
        description: deal.description,
        status: deal.status as DealStatus,
        initiator: deal.initiator as DealInitiator,
        funds_reserved: deal.funds_reserved,
        created_at: deal.created_at,
        accepted_at: deal.accepted_at,
        completed_at: deal.completed_at,
        cancelled_at: deal.cancelled_at,
        cancelled_by: deal.cancelled_by,
        declined_at: deal.declined_at,
        declined_by: deal.declined_by
      },
    });
    console.log(`Created deal with id: ${createdDeal.id}`);
  }

  // Seed disputes
  for (const dispute of seedData.disputes) {
    const createdDispute = await prisma.dispute.upsert({
      where: { id: dispute.id },
      update: {},
      create: {
        id: dispute.id,
        deal_id: dispute.deal_id,
        opened_by: dispute.opened_by,
        opened_by_role: dispute.opened_by_role,
        reason: dispute.reason,
        status: dispute.status as DisputeStatus,
        resolved_at: dispute.resolved_at,
        resolution: dispute.resolution,
        created_at: dispute.created_at,
        updated_at: dispute.updated_at
      },
    });
    console.log(`Created dispute with id: ${createdDispute.id}`);
  }

  // Seed reviews
  for (const review of seedData.reviews) {
    const createdReview = await prisma.review.upsert({
      where: { id: review.id },
      update: {},
      create: review,
    });
    console.log(`Created review with id: ${createdReview.id}`);
  }

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 