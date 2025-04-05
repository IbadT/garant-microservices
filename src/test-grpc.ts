import { credentials } from '@grpc/grpc-js';
import { loadPackageDefinition } from '@grpc/grpc-js';
import { loadSync } from '@grpc/proto-loader';
import { join } from 'path';

const PROTO_PATH = join(__dirname, 'proto/deal.proto');

const packageDefinition = loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const protoDescriptor = loadPackageDefinition(packageDefinition) as any;
const dealService = protoDescriptor.deal.DealService;

const client = new dealService(
  'localhost:50051',
  credentials.createInsecure()
);

async function testSendHello() {
  return new Promise((resolve, reject) => {
    const request = {
      message: 'Hello from gRPC client!'
    };

    client.SendHello(request, (error, response) => {
      if (error) {
        console.error('Error:', error);
        reject(error);
        return;
      }
      console.log('Response:', response);
      resolve(response);
    });
  });
}

async function runTest() {
  try {
    console.log('Testing gRPC SendHello...');
    const result = await testSendHello();
    console.log('Test completed successfully!');
    console.log('Result:', result);
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    client.close();
  }
}

runTest(); 