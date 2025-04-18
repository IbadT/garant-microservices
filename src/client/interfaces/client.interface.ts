import { 
  DealResponse, 
  GetActiveDealsResponse, 
  GetDealByIdResponse,
  SendHelloRequest,
  CreateDealRequest,
  AcceptDealRequest,
  DeclineDealRequest,
  CancelDealRequest,
  ConfirmCompletionRequest,
  OpenDisputeRequest as DealOpenDisputeRequest,
  ResolveDisputeRequest as DealResolveDisputeRequest,
  GetActiveDealsRequest,
  GetDealByIdRequest
} from '../../deals/interfaces/deal.interface';
import { 
  DisputeResponse, 
  GetDisputeByIdResponse, 
  GetDisputesByDealIdResponse,
  OpenDisputeRequest,
  ResolveDisputeRequest,
  GetDisputeByIdRequest,
  GetDisputesByDealIdRequest
} from '../../disputes/interfaces/dispute.interface';

export interface IDealsClient {
  createDeal(data: CreateDealRequest): Promise<DealResponse>;
  acceptDeal(data: AcceptDealRequest): Promise<DealResponse>;
  declineDeal(data: DeclineDealRequest): Promise<DealResponse>;
  cancelDeal(data: CancelDealRequest): Promise<DealResponse>;
  confirmCompletion(data: ConfirmCompletionRequest): Promise<DealResponse>;
  openDispute(data: DealOpenDisputeRequest): Promise<DealResponse>;
  resolveDispute(data: DealResolveDisputeRequest): Promise<DealResponse>;
  getActiveDeals(data: GetActiveDealsRequest): Promise<GetActiveDealsResponse>;
  getDealById(data: GetDealByIdRequest): Promise<GetDealByIdResponse>;
}

export interface IDisputesClient {
  openDispute(data: OpenDisputeRequest): Promise<DisputeResponse>;
  resolveDispute(data: ResolveDisputeRequest): Promise<DisputeResponse>;
  getDisputeById(data: GetDisputeByIdRequest): Promise<GetDisputeByIdResponse>;
  getDisputesByDealId(data: GetDisputesByDealIdRequest): Promise<GetDisputesByDealIdResponse>;
}

// Интерфейсы для ответов контроллера
export interface IDealsController {
  createDeal(data: CreateDealRequest): Promise<DealResponse>;
  acceptDeal(data: AcceptDealRequest): Promise<DealResponse>;
  declineDeal(data: DeclineDealRequest): Promise<DealResponse>;
  cancelDeal(data: CancelDealRequest): Promise<DealResponse>;
  confirmCompletion(data: ConfirmCompletionRequest): Promise<DealResponse>;
  openDispute(data: DealOpenDisputeRequest): Promise<DealResponse>;
  resolveDispute(data: DealResolveDisputeRequest): Promise<DealResponse>;
  getActiveDeals(data: GetActiveDealsRequest): Promise<GetActiveDealsResponse>;
  getDealById(data: GetDealByIdRequest): Promise<GetDealByIdResponse>;
  testKafka(): Promise<{ success: boolean; message: string }>;
}

export interface IDisputesController {
  openDispute(data: OpenDisputeRequest): Promise<DisputeResponse>;
  resolveDispute(data: ResolveDisputeRequest): Promise<DisputeResponse>;
  getDisputeById(data: GetDisputeByIdRequest): Promise<GetDisputeByIdResponse>;
  getDisputesByDealId(data: GetDisputesByDealIdRequest): Promise<GetDisputesByDealIdResponse>;
} 