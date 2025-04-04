// import "./helpers/instrument";
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { MicroserviceOptions, Transport } from "@nestjs/microservices";
import { join } from "path";
import { WsAdapter } from '@nestjs/platform-ws';

declare const module: any;

async function bootstrap() {
  const logger = new Logger();
  
  const app = await NestFactory.create(AppModule);
  
  app.setGlobalPrefix("api");
  
  app.enableCors({
    origin: "*",
    credentials: true,
  });

  const configService = app.get(ConfigService);
  const PORT = configService.get<string>("PORT") ?? 3000;
  const NODE_ENV = configService.get<string>("NODE_ENV");
  const GRPC_URL = configService.get<string>("GRPC_URL");
  const KAFKA_BROKER = configService.get<string>("KAFKA_BROKER");

  const swaggerConfig = new DocumentBuilder()
    .setTitle("Garant documentation")
    .addTag("garant")
    .setDescription("Garant Api Documentation")
    .setVersion("1.0")
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header'
      },
      'JWT-auth'
    )
    .build();

  const PROTO_PATH = join(process.cwd(), "dist/proto/proto/deal.proto");
  // const PROTO_PATH = join(__dirname, "proto/deal.proto");


  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      url: GRPC_URL,
      package: "deal",
      protoPath: PROTO_PATH
    }
  });

  // app.connectMicroservice<MicroserviceOptions>({
  //   transport: Transport.KAFKA,
  //   options: {
  //     client: {
  //       brokers: [KAFKA_BROKER],
  //     },
  //     consumer: {
  //       groupId: "deal-service-group",
  //     },
  //   },
  // });

  // app.useWebSocketAdapter(new WsAdapter(app));

  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  if (NODE_ENV !== 'production') {
    SwaggerModule.setup('api', app, swaggerDocument);
  };

  await app.startAllMicroservices();
  await app.listen(PORT);

  logger.log(`Application is running on: ${await app.getUrl()}`);
  logger.log(`Environment: ${NODE_ENV}`);
  logger.log(`Swagger documentation is available at: ${await app.getUrl()}/api/docs`);

  if(module.hot) {
    module.hot.accept();
    module.hot.dispose(() => app.close());
  };
}

bootstrap();
