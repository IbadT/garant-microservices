import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { DealService } from './deal.service';
import { 
  CreateDealRequest, 
  SendHelloRequest, 
  SendHelloResponse,
  AcceptDealRequest,
  CancelDealRequest,
  ConfirmCompletionRequest,
  DealResponse
} from '../proto/generated/src/proto/deal.pb';

@Controller()
export class DealController {
  constructor(private readonly dealService: DealService) {}

  @GrpcMethod('DealService', 'CreateDeal')
  async createDeal(data: CreateDealRequest): Promise<DealResponse> {
    const deal = await this.dealService.createDeal(data);
    return {
      id: deal.id,
      status: deal.status,
      message: 'Deal created successfully'
    };
  }

  @GrpcMethod('DealService', 'AcceptDeal')
  async acceptDeal(data: AcceptDealRequest): Promise<DealResponse> {
    const deal = await this.dealService.acceptDeal(data.dealId, data.userId);
    return {
      id: deal.id,
      status: deal.status,
      message: 'Deal accepted successfully'
    };
  }

  @GrpcMethod('DealService', 'CancelDeal')
  async cancelDeal(data: CancelDealRequest): Promise<DealResponse> {
    // Implement cancel deal functionality
    return {
      id: data.dealId,
      status: 'CANCELLED',
      message: 'Deal cancelled successfully'
    };
  }

  @GrpcMethod('DealService', 'ConfirmCompletion')
  async confirmCompletion(data: ConfirmCompletionRequest): Promise<DealResponse> {
    // Implement confirm completion functionality
    return {
      id: data.dealId,
      status: 'COMPLETED',
      message: 'Deal completed successfully'
    };
  }

  @GrpcMethod('DealService', 'SendHello')
  async sendHello(data: SendHelloRequest): Promise<SendHelloResponse> {
    console.log("Received message:", data.message);
    return {
      message: `Server received: ${data.message}`
    };
  }
};

// "proto:gen:watch": "nodemon --watch src/proto --ext proto --exec 'npm run proto:gen'"
// "build": "nest build && mkdir -p dist/proto && cp -r src/proto/*.proto dist/proto/",