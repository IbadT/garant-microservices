// Code generated by protoc-gen-ts_proto. DO NOT EDIT.
// versions:
//   protoc-gen-ts_proto  v2.7.0
//   protoc               v5.29.3
// source: proto/garant.proto

/* eslint-disable */
import { Metadata } from "@grpc/grpc-js";
import { GrpcMethod, GrpcStreamMethod } from "@nestjs/microservices";
import { Observable } from "rxjs";

export const protobufPackage = "garant";

/** Common Messages */
export interface SendHelloRequest {
  message: string;
}

export interface SendHelloResponse {
  message: string;
}

/** Deal Service Messages */
export interface CreateDealRequest {
  initiatorId: string;
  targetId: string;
  amount: number;
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

export interface DealResponse {
  id: string;
  status: string;
  message: string;
}

export interface CancelDealRequest {
  dealId: string;
  userId: string;
}

export interface ConfirmCompletionRequest {
  dealId: string;
  userId: string;
}

export interface OpenDealDisputeRequest {
  dealId: string;
  userId: string;
  reason: string;
}

export interface ResolveDealDisputeRequest {
  dealId: string;
  disputeId: string;
  resolution: string;
  moderatorId: string;
}

export interface GetActiveDealsRequest {
  userId: string;
}

export interface GetActiveDealsResponse {
  deals: Deal[];
}

export interface GetDealByIdRequest {
  dealId: string;
}

export interface GetDealByIdResponse {
  deal: Deal | undefined;
}

export interface Deal {
  id: string;
  customerId: string;
  vendorId: string;
  amount: number;
  description: string;
  status: string;
  initiator: string;
  fundsReserved: boolean;
  createdAt: string;
  acceptedAt: string;
  completedAt: string;
  cancelledAt: string;
  cancelledBy: string;
  declinedAt: string;
  declinedBy: string;
  lastDispute: Dispute | undefined;
}

/** Disputes Service Messages */
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
  status: string;
  message: string;
}

export interface Dispute {
  id: string;
  dealId: string;
  openedBy: string;
  openedByRole: string;
  reason: string;
  status: string;
  resolvedAt: string;
  resolution: string;
  createdAt: string;
  updatedAt: string;
}

export interface GetDisputeByIdResponse {
  dispute: Dispute | undefined;
}

export interface GetDisputesByDealIdResponse {
  disputes: Dispute[];
}

export const GARANT_PACKAGE_NAME = "garant";

/** Deal Service */

export interface DealServiceClient {
  createDeal(request: CreateDealRequest, metadata?: Metadata): Observable<DealResponse>;

  acceptDeal(request: AcceptDealRequest, metadata?: Metadata): Observable<DealResponse>;

  declineDeal(request: DeclineDealRequest, metadata?: Metadata): Observable<DealResponse>;

  cancelDeal(request: CancelDealRequest, metadata?: Metadata): Observable<DealResponse>;

  confirmCompletion(request: ConfirmCompletionRequest, metadata?: Metadata): Observable<DealResponse>;

  openDealDispute(request: OpenDealDisputeRequest, metadata?: Metadata): Observable<DealResponse>;

  resolveDealDispute(request: ResolveDealDisputeRequest, metadata?: Metadata): Observable<DealResponse>;

  getActiveDeals(request: GetActiveDealsRequest, metadata?: Metadata): Observable<GetActiveDealsResponse>;

  getDealById(request: GetDealByIdRequest, metadata?: Metadata): Observable<GetDealByIdResponse>;

  sendHello(request: SendHelloRequest, metadata?: Metadata): Observable<SendHelloResponse>;
}

/** Deal Service */

export interface DealServiceController {
  createDeal(
    request: CreateDealRequest,
    metadata?: Metadata,
  ): Promise<DealResponse> | Observable<DealResponse> | DealResponse;

  acceptDeal(
    request: AcceptDealRequest,
    metadata?: Metadata,
  ): Promise<DealResponse> | Observable<DealResponse> | DealResponse;

  declineDeal(
    request: DeclineDealRequest,
    metadata?: Metadata,
  ): Promise<DealResponse> | Observable<DealResponse> | DealResponse;

  cancelDeal(
    request: CancelDealRequest,
    metadata?: Metadata,
  ): Promise<DealResponse> | Observable<DealResponse> | DealResponse;

  confirmCompletion(
    request: ConfirmCompletionRequest,
    metadata?: Metadata,
  ): Promise<DealResponse> | Observable<DealResponse> | DealResponse;

  openDealDispute(
    request: OpenDealDisputeRequest,
    metadata?: Metadata,
  ): Promise<DealResponse> | Observable<DealResponse> | DealResponse;

  resolveDealDispute(
    request: ResolveDealDisputeRequest,
    metadata?: Metadata,
  ): Promise<DealResponse> | Observable<DealResponse> | DealResponse;

  getActiveDeals(
    request: GetActiveDealsRequest,
    metadata?: Metadata,
  ): Promise<GetActiveDealsResponse> | Observable<GetActiveDealsResponse> | GetActiveDealsResponse;

  getDealById(
    request: GetDealByIdRequest,
    metadata?: Metadata,
  ): Promise<GetDealByIdResponse> | Observable<GetDealByIdResponse> | GetDealByIdResponse;

  sendHello(
    request: SendHelloRequest,
    metadata?: Metadata,
  ): Promise<SendHelloResponse> | Observable<SendHelloResponse> | SendHelloResponse;
}

export function DealServiceControllerMethods() {
  return function (constructor: Function) {
    const grpcMethods: string[] = [
      "createDeal",
      "acceptDeal",
      "declineDeal",
      "cancelDeal",
      "confirmCompletion",
      "openDealDispute",
      "resolveDealDispute",
      "getActiveDeals",
      "getDealById",
      "sendHello",
    ];
    for (const method of grpcMethods) {
      const descriptor: any = Reflect.getOwnPropertyDescriptor(constructor.prototype, method);
      GrpcMethod("DealService", method)(constructor.prototype[method], method, descriptor);
    }
    const grpcStreamMethods: string[] = [];
    for (const method of grpcStreamMethods) {
      const descriptor: any = Reflect.getOwnPropertyDescriptor(constructor.prototype, method);
      GrpcStreamMethod("DealService", method)(constructor.prototype[method], method, descriptor);
    }
  };
}

export const DEAL_SERVICE_NAME = "DealService";

/** Disputes Service */

export interface DisputesServiceClient {
  openDispute(request: OpenDisputeRequest, metadata?: Metadata): Observable<DisputeResponse>;

  resolveDispute(request: ResolveDisputeRequest, metadata?: Metadata): Observable<DisputeResponse>;

  getDisputeById(request: GetDisputeByIdRequest, metadata?: Metadata): Observable<GetDisputeByIdResponse>;

  getDisputesByDealId(
    request: GetDisputesByDealIdRequest,
    metadata?: Metadata,
  ): Observable<GetDisputesByDealIdResponse>;
}

/** Disputes Service */

export interface DisputesServiceController {
  openDispute(
    request: OpenDisputeRequest,
    metadata?: Metadata,
  ): Promise<DisputeResponse> | Observable<DisputeResponse> | DisputeResponse;

  resolveDispute(
    request: ResolveDisputeRequest,
    metadata?: Metadata,
  ): Promise<DisputeResponse> | Observable<DisputeResponse> | DisputeResponse;

  getDisputeById(
    request: GetDisputeByIdRequest,
    metadata?: Metadata,
  ): Promise<GetDisputeByIdResponse> | Observable<GetDisputeByIdResponse> | GetDisputeByIdResponse;

  getDisputesByDealId(
    request: GetDisputesByDealIdRequest,
    metadata?: Metadata,
  ): Promise<GetDisputesByDealIdResponse> | Observable<GetDisputesByDealIdResponse> | GetDisputesByDealIdResponse;
}

export function DisputesServiceControllerMethods() {
  return function (constructor: Function) {
    const grpcMethods: string[] = ["openDispute", "resolveDispute", "getDisputeById", "getDisputesByDealId"];
    for (const method of grpcMethods) {
      const descriptor: any = Reflect.getOwnPropertyDescriptor(constructor.prototype, method);
      GrpcMethod("DisputesService", method)(constructor.prototype[method], method, descriptor);
    }
    const grpcStreamMethods: string[] = [];
    for (const method of grpcStreamMethods) {
      const descriptor: any = Reflect.getOwnPropertyDescriptor(constructor.prototype, method);
      GrpcStreamMethod("DisputesService", method)(constructor.prototype[method], method, descriptor);
    }
  };
}

export const DISPUTES_SERVICE_NAME = "DisputesService";
