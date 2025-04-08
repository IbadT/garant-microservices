import { credentials } from '@grpc/grpc-js';
import { loadPackageDefinition } from '@grpc/grpc-js';
import { loadSync } from '@grpc/proto-loader';
import { join } from 'path';

const PROTO_PATH = join(__dirname, 'proto/garant.proto');

const packageDefinition = loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

interface ProtoDescriptor {
  garant: {
    DealService: any;
  };
}

const protoDescriptor = loadPackageDefinition(packageDefinition) as unknown as ProtoDescriptor;
const DealService = protoDescriptor.garant.DealService;

if (!DealService) {
  console.error('Error: DealService not found in the proto descriptor');
  process.exit(1);
}

const client = new DealService(
  'localhost:50051',
  credentials.createInsecure()
);

async function testSendHello() {
  return new Promise((resolve, reject) => {
    console.log('Sending hello request...');
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
    if (client && typeof client.close === 'function') {
      client.close();
    }
  }
}

runTest(); 