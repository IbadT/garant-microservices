import { Module } from "@nestjs/common";
import { DealController } from "./deal.controller";
import { PrismaService } from "src/prisma.service";
import { DealService } from "./deal.service";
import { KafkaService } from "src/kafka/kafka.service";
import { NotificationService } from "src/notifications/notification.service";




@Module({
    controllers: [DealController],
    providers: [PrismaService, DealService, KafkaService, NotificationService]
})
export class DealModule{}