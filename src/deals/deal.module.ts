import { Module } from "@nestjs/common";
import { DealController } from "./deal.controller";
import { PrismaService } from "src/prisma.service";
import { DealService } from "./deal.service";
import { KafkaService } from "src/kafka/kafka.service";
import { NotificationService } from "src/notifications/notification.service";
import { NotificationGateway } from "src/notifications/notification.gateway";
import { ClientsModule, Transport } from "@nestjs/microservices";
import { join } from "path";
import { JwtModule } from "@nestjs/jwt";
import { ConfigModule, ConfigService } from "@nestjs/config";

@Module({
    imports: [
        ClientsModule.registerAsync([
            {
                name: "DEAL_PACKAGE",
                imports: [ConfigModule],
                useFactory: async (configService: ConfigService) => ({
                    transport: Transport.GRPC,
                    options: {
                        url: configService.get<string>("GRPC_URL"),
                        package: "deal",
                        protoPath: join(process.cwd(), "src/proto/deal.proto"),
                    },
                }),
                inject: [ConfigService],
            }
        ]),
        JwtModule.registerAsync({
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService) => ({
                secret: configService.get<string>('JWT_SECRET'),
                signOptions: { expiresIn: '1d' },
            }),
            inject: [ConfigService],
        }),
    ],
    controllers: [DealController],
    providers: [PrismaService, DealService, KafkaService, NotificationService, NotificationGateway]
})
export class DealModule{}