import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka, Producer, Consumer, EachMessagePayload } from 'kafkajs';

@Injectable()
export class KafkaService implements OnModuleDestroy {
  private kafka: Kafka;
  private producer: Producer;
  private consumer: Consumer;
  private logger = new Logger(KafkaService.name)
  private isConsumerRunning = false;

  constructor(
    private readonly configService: ConfigService
  ) {
    this.kafka = new Kafka({
      clientId: 'deal-service',
      brokers: [this.configService.get<string>("KAFKA_BROKER") || ""],
    });

    this.producer = this.kafka.producer();
    this.consumer = this.kafka.consumer({ groupId: 'deal-service-group' });
  }

  async connect() {
    await this.producer.connect();
    await this.consumer.connect();
    // Не подписываемся на топик здесь, это будет сделано в subscribeToDealUpdates
  }

  async sendDealEvent(event: { type: string; payload: any }) {
    await this.producer.send({
      topic: 'deal-events',
      messages: [
        {
          value: JSON.stringify(event),
        },
      ],
    });
  }

  async subscribeToDealUpdates(callback: (message: unknown) => Promise<void>) {
    // Проверяем, не запущен ли уже потребитель
    if (this.isConsumerRunning) {
      this.logger.warn('Consumer is already running, skipping subscription');
      return;
    }

    // Подписываемся на топик только если потребитель еще не запущен
    await this.consumer.subscribe({ topic: 'deal-events' });
    
    // Запускаем потребителя
    await this.consumer.run({
      eachMessage: async ({ message }: EachMessagePayload) => {
        try {
          if (!message.value) {
            this.logger.warn('Received empty message');
            return;
          }
          const value = JSON.parse(message.value.toString());
          await callback(value);
        } catch (e) {
          this.logger.error(`Message processing error: ${e.message}`);
        }
      },
    });
    
    this.isConsumerRunning = true;
    this.logger.log('Kafka consumer started successfully');
  }

  async onModuleDestroy() {
    await this.producer.disconnect();
    await this.consumer.disconnect();
  }
}










// import { Injectable, OnModuleDestroy } from '@nestjs/common';
// import { ConfigService } from '@nestjs/config';
// import { Kafka, Producer, Consumer, EachMessagePayload } from 'kafkajs';

// @Injectable()
// export class KafkaService implements OnModuleDestroy {
//   private kafka: Kafka;
//   private producer: Producer;
//   private consumer: Consumer;

//   constructor(
//     private readonly configService: ConfigService
//   ) {
//     this.kafka = new Kafka({
//       clientId: 'deal-service',
//       brokers: [this.configService.get<string>("KAFKA_BROKER") || ""],
//     });

//     this.producer = this.kafka.producer();
//     this.consumer = this.kafka.consumer({ groupId: 'deal-service-group' });

//     this.connect();
//   }

//   async connect() {
//     await this.producer.connect();
//     await this.consumer.connect();
//     await this.consumer.subscribe({ topic: 'deal-events' });
//   }

//   async sendDealEvent(event: { type: string; payload: any }) {
//     await this.producer.send({
//       topic: 'deal-events',
//       messages: [
//         {
//           value: JSON.stringify(event),
//         },
//       ],
//     });
//   }

//   async subscribeToDealUpdates(callback: (message: any) => Promise<void>) {
//     await this.consumer.run({
//       eachMessage: async ({ message }: EachMessagePayload) => {
//         const value = JSON.parse(message.value.toString());
//         await callback(value);
//       },
//     });
//   }

//   async onModuleDestroy() {
//     await this.producer.disconnect();
//     await this.consumer.disconnect();
//   }
// }