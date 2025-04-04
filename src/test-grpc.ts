import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import * as path from 'path';
import * as fs from 'fs';

// Загрузка proto файла
const PROTO_PATH = path.resolve(__dirname, './proto/deal.proto');

// Проверка существования файла
if (!fs.existsSync(PROTO_PATH)) {
  console.error(`Proto file not found at ${PROTO_PATH}`);
  process.exit(1);
}

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

// Получение сервиса из загруженного proto
const protoDescriptor = grpc.loadPackageDefinition(packageDefinition);
const dealService = protoDescriptor.deal;

// Создание клиента
const client = new (dealService as any).DealService(
  'localhost:50051',
  grpc.credentials.createInsecure()
);

// Функция для тестирования gRPC соединения
function testGrpcConnection() {
  return new Promise((resolve, reject) => {
    // Проверка соединения
    const deadline = new Date();
    deadline.setSeconds(deadline.getSeconds() + 5);

    client.waitForReady(deadline, (error) => {
      if (error) {
        console.error('Error connecting to gRPC server:', error);
        reject(error);
        return;
      }

      console.log('Successfully connected to gRPC server!');
      
      // Тестирование метода SendHello
      client.SendHello({ message: 'Hello from test client!' }, (err, response) => {
        if (err) {
          console.error('Error calling SendHello:', err);
          reject(err);
          return;
        }
        console.log('SendHello response:', response);
        resolve(response);
      });
    });
  });
}

// Запуск теста
console.log('Testing gRPC connection...');
testGrpcConnection()
  .then(() => {
    console.log('gRPC test completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('gRPC test failed:', error);
    process.exit(1);
  }); 