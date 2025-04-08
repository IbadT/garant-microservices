import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka, Producer, Consumer, EachMessagePayload } from 'kafkajs';

@Injectable()
export class KafkaService implements OnModuleInit, OnModuleDestroy {
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

  async onModuleInit() {
    await this.connect();
  }

  async connect() {
    try {
      await this.producer.connect();
      this.logger.log('Kafka producer connected successfully');
      
      await this.consumer.connect();
      this.logger.log('Kafka consumer connected successfully');
    } catch (error) {
      this.logger.error(`Failed to connect to Kafka: ${error.message}`);
      throw error;
    }
  }

  async sendDealEvent(event: { type: string; payload: any }) {
    try {
      await this.producer.send({
        topic: 'deal-events',
        messages: [
          {
            value: JSON.stringify(event),
          },
        ],
      });
      this.logger.log(`Event sent to Kafka: ${event.type}`);
    } catch (error) {
      this.logger.error(`Failed to send event to Kafka: ${error.message}`);
      throw error;
    }
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
    try {
      await this.producer.disconnect();
      this.logger.log('Kafka producer disconnected');
      
      await this.consumer.disconnect();
      this.logger.log('Kafka consumer disconnected');
    } catch (error) {
      this.logger.error(`Error disconnecting from Kafka: ${error.message}`);
    }
  }
}