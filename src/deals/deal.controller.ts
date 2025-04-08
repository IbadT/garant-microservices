import { Controller, UseFilters, UsePipes, ValidationPipe } from '@nestjs/common';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import { DealService } from './deal.service';
import { 
  CreateDealRequest, 
  SendHelloRequest, 
  SendHelloResponse,
  AcceptDealRequest,
  CancelDealRequest,
  ConfirmCompletionRequest,
  DealResponse,
  DeclineDealRequest,
  OpenDisputeRequest,
  ResolveDisputeRequest,
  GetActiveDealsRequest,
  GetDealByIdRequest
} from '../proto/generated/src/proto/deal.pb';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SendHelloDto } from './dto/send-hello.dto';
import { CreateDealDto } from './dto/create-deal.dto';
import { AcceptDealDto } from './dto/accept-deal.dto';
import { CancelDealDto } from './dto/cancel-deal.dto';
import { ConfirmCompletionDto } from './dto/confirm-completion.dto';
import { DeclineDealDto } from './dto/decline-deal.dto';
import { OpenDisputeDto } from './dto/open-dispute.dto';
import { ResolveDisputeDto } from './dto/resolve-dispute.dto';

/**
 * Контроллер для работы со сделками через gRPC
 * Предоставляет методы для управления сделками в системе
 */
@ApiTags('Deals (gRPC)')
@Controller()
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class DealController {
  /**
   * Создает экземпляр DealController
   * @param dealService - Сервис для работы со сделками
   */
  constructor(private readonly dealService: DealService) {}

  @ApiOperation({ summary: 'Create deal', description: 'Creates a new deal initiated by either customer or vendor' })
  @GrpcMethod('DealService', 'CreateDeal')
  async createDeal(data: CreateDealRequest): Promise<DealResponse> {
    try {
      const createDealDto = new CreateDealDto();
      Object.assign(createDealDto, data);
      
      const errors = await this.validateDto(createDealDto);
      if (errors.length > 0) {
        throw new RpcException({
          code: 3,
          message: JSON.stringify(errors)
        });
      }
      
      const deal = await this.dealService.createDeal(data);
      return {
        id: deal.id,
        status: deal.status,
        message: 'Deal created successfully'
      };
    } catch (error) {
      if (error instanceof RpcException) {
        throw error;
      }
      throw new RpcException({
        code: 13,
        message: error.message || 'Internal server error'
      });
    }
  }

  @ApiOperation({ summary: 'Accept deal', description: 'Accepts an existing deal by either customer or vendor' })
  @GrpcMethod('DealService', 'AcceptDeal')
  async acceptDeal(data: AcceptDealRequest): Promise<DealResponse> {
    try {
      const acceptDealDto = new AcceptDealDto();
      Object.assign(acceptDealDto, data);
      
      const errors = await this.validateDto(acceptDealDto);
      if (errors.length > 0) {
        throw new RpcException({
          code: 3,
          message: JSON.stringify(errors)
        });
      }
      
      const deal = await this.dealService.acceptDeal(data.dealId, data.userId);
      return {
        id: deal.id,
        status: deal.status,
        message: 'Deal accepted successfully'
      };
    } catch (error) {
      if (error instanceof RpcException) {
        throw error;
      }
      throw new RpcException({
        code: 13,
        message: error.message || 'Internal server error'
      });
    }
  }

  @ApiOperation({ summary: 'Decline deal', description: 'Declines an existing deal by either customer or vendor' })
  @GrpcMethod('DealService', 'DeclineDeal')
  async declineDeal(data: DeclineDealRequest): Promise<DealResponse> {
    try {
      const declineDealDto = new DeclineDealDto();
      Object.assign(declineDealDto, data);
      
      const errors = await this.validateDto(declineDealDto);
      if (errors.length > 0) {
        throw new RpcException({
          code: 3,
          message: JSON.stringify(errors)
        });
      }
      
      const deal = await this.dealService.declineDeal(data.dealId, data.userId);
      return {
        id: deal.id,
        status: deal.status,
        message: 'Deal declined successfully'
      };
    } catch (error) {
      if (error instanceof RpcException) {
        throw error;
      }
      throw new RpcException({
        code: 13,
        message: error.message || 'Internal server error'
      });
    }
  }

  @ApiOperation({ summary: 'Cancel deal', description: 'Cancels an existing deal by either customer or vendor' })
  @GrpcMethod('DealService', 'CancelDeal')
  async cancelDeal(data: CancelDealRequest): Promise<DealResponse> {
    try {
      const cancelDealDto = new CancelDealDto();
      Object.assign(cancelDealDto, data);
      
      const errors = await this.validateDto(cancelDealDto);
      if (errors.length > 0) {
        throw new RpcException({
          code: 3,
          message: JSON.stringify(errors)
        });
      }
      
      const deal = await this.dealService.cancelDeal(data.dealId, data.userId);
      return {
        id: deal.id,
        status: deal.status,
        message: 'Deal cancelled successfully'
      };
    } catch (error) {
      if (error instanceof RpcException) {
        throw error;
      }
      throw new RpcException({
        code: 13,
        message: error.message || 'Internal server error'
      });
    }
  }

  @ApiOperation({ summary: 'Confirm completion', description: 'Confirms completion of a deal by the customer' })
  @GrpcMethod('DealService', 'ConfirmCompletion')
  async confirmCompletion(data: ConfirmCompletionRequest): Promise<DealResponse> {
    try {
      const confirmCompletionDto = new ConfirmCompletionDto();
      Object.assign(confirmCompletionDto, data);
      
      const errors = await this.validateDto(confirmCompletionDto);
      if (errors.length > 0) {
        throw new RpcException({
          code: 3,
          message: JSON.stringify(errors)
        });
      }
      
      const deal = await this.dealService.confirmCompletion(data.dealId, data.userId);
      return {
        id: deal.id,
        status: deal.status,
        message: 'Deal completed successfully'
      };
    } catch (error) {
      if (error instanceof RpcException) {
        throw error;
      }
      throw new RpcException({
        code: 13,
        message: error.message || 'Internal server error'
      });
    }
  }

  /**
   * Открывает спор по сделке
   * @param data - Данные для открытия спора
   * @returns {Promise<DealResponse>} Результат открытия спора
   * @throws {RpcException} Если данные невалидны или произошла внутренняя ошибка
   */
  @ApiOperation({ summary: 'Open dispute', description: 'Opens a dispute for a deal by either customer or vendor' })
  @GrpcMethod('DealService', 'OpenDealDispute')
  async openDispute(data: OpenDisputeRequest): Promise<DealResponse> {
    try {
      const openDisputeDto = new OpenDisputeDto();
      Object.assign(openDisputeDto, data);
      
      const errors = await this.validateDto(openDisputeDto);
      if (errors.length > 0) {
        throw new RpcException({
          code: 3,
          message: JSON.stringify(errors)
        });
      }
      
      const result = await this.dealService.openDispute(data.dealId, data.userId, data.reason);
      return {
        id: result.deal.id,
        status: result.deal.status,
        message: 'Dispute opened successfully'
      };
    } catch (error) {
      if (error instanceof RpcException) {
        throw error;
      }
      throw new RpcException({
        code: 13,
        message: error.message || 'Internal server error'
      });
    }
  }

  /**
   * Разрешает спор по сделке
   * @param data - Данные для разрешения спора
   * @returns {Promise<DealResponse>} Результат разрешения спора
   * @throws {RpcException} Если данные невалидны или произошла внутренняя ошибка
   */
  @ApiOperation({ summary: 'Resolve dispute', description: 'Resolves a dispute for a deal by a moderator' })
  @GrpcMethod('DealService', 'ResolveDealDispute')
  async resolveDispute(data: ResolveDisputeRequest): Promise<DealResponse> {
    try {
      const resolveDisputeDto = new ResolveDisputeDto();
      Object.assign(resolveDisputeDto, data);
      
      const errors = await this.validateDto(resolveDisputeDto);
      if (errors.length > 0) {
        throw new RpcException({
          code: 3,
          message: JSON.stringify(errors)
        });
      }
      
      const result = await this.dealService.resolveDispute(
        data.dealId,
        data.disputeId,
        data.resolution,
        data.moderatorId
      );
      return {
        id: result.deal.id,
        status: result.deal.status,
        message: 'Dispute resolved successfully'
      };
    } catch (error) {
      if (error instanceof RpcException) {
        throw error;
      }
      throw new RpcException({
        code: 13,
        message: error.message || 'Internal server error'
      });
    }
  }

  @ApiOperation({ summary: 'Get active deals', description: 'Gets all active deals for a user' })
  @GrpcMethod('DealService', 'GetActiveDeals')
  async getActiveDeals(data: GetActiveDealsRequest): Promise<any> {
    try {
      const deals = await this.dealService.getActiveDeals(data.userId);
      return { deals };
    } catch (error) {
      if (error instanceof RpcException) {
        throw error;
      }
      throw new RpcException({
        code: 13,
        message: error.message || 'Internal server error'
      });
    }
  }

  @ApiOperation({ summary: 'Get deal by ID', description: 'Gets a specific deal by its ID' })
  @GrpcMethod('DealService', 'GetDealById')
  async getDealById(data: GetDealByIdRequest): Promise<any> {
    try {
      const deal = await this.dealService.getDealById(data.dealId);
      return { deal };
    } catch (error) {
      if (error instanceof RpcException) {
        throw error;
      }
      throw new RpcException({
        code: 13,
        message: error.message || 'Internal server error'
      });
    }
  }

  @ApiOperation({ summary: 'Send hello', description: 'Sends a hello message' })
  @GrpcMethod('DealService', 'SendHello')
  async sendHello(data: SendHelloRequest): Promise<SendHelloResponse> {
    try {
      // Валидация входных данных
      const sendHelloDto = new SendHelloDto();
      Object.assign(sendHelloDto, data);
      
      // Проверка валидации
      const errors = await this.validateDto(sendHelloDto);
      if (errors.length > 0) {
        throw new RpcException({
          code: 3, // INVALID_ARGUMENT
          message: JSON.stringify(errors)
        });
      }
      
      console.log("Received message:", data.message);
      return {
        message: `Server received: ${data.message}`
      };
    } catch (error) {
      if (error instanceof RpcException) {
        throw error;
      }
      throw new RpcException({
        code: 13, // INTERNAL
        message: error.message || 'Internal server error'
      });
    }
  }
  
  /**
   * Валидирует DTO объект
   * @param dto - Объект для валидации
   * @returns {Promise<string[]>} Массив ошибок валидации
   */
  private async validateDto(dto: any): Promise<string[]> {
    const errors: string[] = [];
    const validationPipe = new ValidationPipe({ transform: true, whitelist: true });
    try {
      await validationPipe.transform(dto, { type: 'body', metatype: dto.constructor });
    } catch (error: any) {
      if (error.response && Array.isArray(error.response.message)) {
        errors.push(...error.response.message);
        // errors.push(...(error.response.message as string[]));
      } else {
        errors.push(error.message);
        // errors.push(error.message as string);
      }
    }
    return errors;
  }
};

// "proto:gen:watch": "nodemon --watch src/proto --ext proto --exec 'npm run proto:gen'"
// "build": "nest build && mkdir -p dist/proto && cp -r src/proto/*.proto dist/proto/"