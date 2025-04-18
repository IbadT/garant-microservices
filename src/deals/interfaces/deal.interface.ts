export interface IDealsService {
  sendHello(data: SendHelloRequest): Promise<SendHelloResponse>;
  createDeal(data: CreateDealRequest): Promise<DealResponse>;
  acceptDeal(data: AcceptDealRequest): Promise<DealResponse>;
  declineDeal(data: DeclineDealRequest): Promise<DealResponse>;
  cancelDeal(data: CancelDealRequest): Promise<DealResponse>;
  confirmCompletion(data: ConfirmCompletionRequest): Promise<DealResponse>;
  openDispute(data: OpenDisputeRequest): Promise<DealResponse>;
  resolveDispute(data: ResolveDisputeRequest): Promise<DealResponse>;
  getActiveDeals(data: GetActiveDealsRequest): Promise<GetActiveDealsResponse>;
  getDealById(data: GetDealByIdRequest): Promise<GetDealByIdResponse>;
}

export interface SendHelloRequest {
  name: string;
}

export interface SendHelloResponse {
  message: string;
}

export interface CreateDealRequest {
  amount: number;
  initiatorId: string;
  targetId: string;
  description: string;
  isCustomerInitiator: boolean;
}

export interface AcceptDealRequest {
  dealId: string;
  userId: string;
}

export interface DeclineDealRequest {
  dealId: string;
  userId: string;
}

export interface CancelDealRequest {
  dealId: string;
  userId: string;
}

export interface ConfirmCompletionRequest {
  dealId: string;
  userId: string;
}

export interface OpenDisputeRequest {
  dealId: string;
  userId: string;
  reason: string;
}

export interface ResolveDisputeRequest {
  dealId: string;
  disputeId: string;
  resolution: string;
  moderatorId: string;
}

export interface GetActiveDealsRequest {
  userId: string;
}

export interface GetDealByIdRequest {
  dealId: string;
}

export interface DealResponse {
  id: string;
  vendor_id: string;
  customer_id: string;
  amount: number;
  status: string;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  disputes: any[];
  funds_reserved: boolean;
  initiator: string;
  description: string;
  accepted_at: string | null;
  cancelled_at: string | null;
  cancelled_by: string | null;
  declined_at: string | null;
  declined_by: string | null;
}

export interface GetActiveDealsResponse {
  deals: DealResponse[];
}

export interface GetDealByIdResponse {
  deal: DealResponse;
} 