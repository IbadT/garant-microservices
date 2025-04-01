import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Kafka, Producer, Consumer, EachMessagePayload } from 'kafkajs';

@Injectable()
export class KafkaService implements OnModuleDestroy {
  private kafka: Kafka;
  private producer: Producer;
  private consumer: Consumer;

  constructor() {
    this.kafka = new Kafka({
      clientId: 'deal-service',
      brokers: [process.env.KAFKA_BROKER],
    });

    this.producer = this.kafka.producer();
    this.consumer = this.kafka.consumer({ groupId: 'deal-service-group' });

    this.connect();
  }

  async connect() {
    await this.producer.connect();
    await this.consumer.connect();
    await this.consumer.subscribe({ topic: 'deal-events' });
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

  async subscribeToDealUpdates(callback: (message: any) => Promise<void>) {
    await this.consumer.run({
      eachMessage: async ({ message }: EachMessagePayload) => {
        const value = JSON.parse(message.value.toString());
        await callback(value);
      },
    });
  }

  async onModuleDestroy() {
    await this.producer.disconnect();
    await this.consumer.disconnect();
  }
}