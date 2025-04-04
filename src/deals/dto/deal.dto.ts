export class CreateDealRequest {
  initiator_id: string;
  target_id: string;
  amount: number;
  description: string;
  is_customer_initiator: boolean;
}

export class DealResponse {
  id: string;
  status: string;
  message?: string;
}