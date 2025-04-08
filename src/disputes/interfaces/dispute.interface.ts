export interface IDisputesService {
  openDispute(data: OpenDisputeRequest): Promise<DisputeResponse>;
  resolveDispute(data: ResolveDisputeRequest): Promise<DisputeResponse>;
  getDisputeById(data: GetDisputeByIdRequest): Promise<GetDisputeByIdResponse>;
  getDisputesByDealId(data: GetDisputesByDealIdRequest): Promise<GetDisputesByDealIdResponse>;
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

export interface GetDisputeByIdRequest {
  disputeId: string;
}

export interface GetDisputesByDealIdRequest {
  dealId: string;
}

export interface DisputeResponse {
  id: string;
  deal_id: string;
  status: string;
  opened_by: string;
  opened_by_role: string;
  reason: string;
  resolution: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface GetDisputeByIdResponse {
  dispute: DisputeResponse;
}

export interface GetDisputesByDealIdResponse {
  disputes: DisputeResponse[];
} 