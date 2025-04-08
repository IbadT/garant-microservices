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
        created_at: new Date(user.created_at),
        updated_at: new Date(user.updated_at)
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
        created_at: new Date(deal.created_at),
        accepted_at: deal.accepted_at ? new Date(deal.accepted_at) : null,
        completed_at: deal.completed_at ? new Date(deal.completed_at) : null,
        cancelled_at: deal.cancelled_at ? new Date(deal.cancelled_at) : null,
        cancelled_by: deal.cancelled_by,
        declined_at: deal.declined_at ? new Date(deal.declined_at) : null,
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
        opened_by_role: dispute.opened_by_role as UserRole,
        reason: dispute.reason,
        status: dispute.status as DisputeStatus,
        resolved_at: dispute.resolved_at ? new Date(dispute.resolved_at) : null,
        resolution: dispute.resolution,
        created_at: new Date(dispute.created_at),
        updated_at: new Date(dispute.updated_at)
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