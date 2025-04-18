import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiParam, ApiBody } from '@nestjs/swagger';
import { DealStatus, DealInitiator, DisputeStatus } from '@prisma/client';

// Декораторы для Deals
export const ApiSendHello = () => {
  return applyDecorators(
    ApiOperation({ summary: 'Send hello message' }),
    ApiBody({
      schema: {
        type: 'object',
        properties: {
          message: { type: 'string', description: 'Hello message to send' },
        },
        required: ['message'],
      },
    }),
    ApiResponse({
      status: 200,
      description: 'Hello message sent successfully',
      schema: {
        type: 'object',
        properties: {
          message: { type: 'string' },
        },
      },
    }),
    ApiResponse({ status: 400, description: 'Bad request' }),
    ApiResponse({ status: 500, description: 'Internal server error' }),
  );
};

export const ApiCreateDeal = () => {
  return applyDecorators(
    ApiOperation({ summary: 'Create a new deal' }),
    ApiBody({
      schema: {
        type: 'object',
        properties: {
          initiatorId: { type: 'string', format: 'uuid', description: 'ID of the user initiating the deal' },
          targetId: { type: 'string', format: 'uuid', description: 'ID of the target user' },
          amount: { type: 'number', description: 'Amount of the deal' },
          description: { type: 'string', description: 'Description of the deal' },
          isCustomerInitiator: { type: 'boolean', description: 'Whether the initiator is a customer' },
        },
        required: ['initiatorId', 'targetId', 'amount', 'description', 'isCustomerInitiator'],
      },
    }),
    ApiResponse({
      status: 200,
      description: 'Deal created successfully',
      schema: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          status: { type: 'string', enum: Object.values(DealStatus) },
          message: { type: 'string' },
        },
      },
    }),
    ApiResponse({ status: 400, description: 'Bad request' }),
    ApiResponse({ status: 500, description: 'Internal server error' }),
  );
};

export const ApiAcceptDeal = () => {
  return applyDecorators(
    ApiOperation({ summary: 'Accept a deal' }),
    ApiBody({
      schema: {
        type: 'object',
        properties: {
          dealId: { type: 'string', format: 'uuid', description: 'ID of the deal to accept', example: "550e8400-e29b-41d4-a716-446655440003" },
          userId: { type: 'string', format: 'uuid', description: 'ID of the user accepting the deal', example: "550e8400-e29b-41d4-a716-446655440000" },
        },
        required: ['dealId', 'userId'],
      },
    }),
    ApiResponse({
      status: 200,
      description: 'Deal accepted successfully',
      schema: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          status: { type: 'string', enum: Object.values(DealStatus) },
          message: { type: 'string' },
        },
      },
    }),
    ApiResponse({ status: 400, description: 'Bad request' }),
    ApiResponse({ status: 404, description: 'Deal not found' }),
    ApiResponse({ status: 500, description: 'Internal server error' }),
  );
};

export const ApiDeclineDeal = () => {
  return applyDecorators(
    ApiOperation({ summary: 'Decline a deal' }),
    ApiBody({
      schema: {
        type: 'object',
        properties: {
          dealId: { type: 'string', format: 'uuid', description: 'ID of the deal to decline' },
          userId: { type: 'string', format: 'uuid', description: 'ID of the user declining the deal' },
        },
        required: ['dealId', 'userId'],
      },
    }),
    ApiResponse({
      status: 200,
      description: 'Deal declined successfully',
      schema: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          status: { type: 'string', enum: Object.values(DealStatus) },
          message: { type: 'string' },
        },
      },
    }),
    ApiResponse({ status: 400, description: 'Bad request' }),
    ApiResponse({ status: 404, description: 'Deal not found' }),
    ApiResponse({ status: 500, description: 'Internal server error' }),
  );
};

export const ApiCancelDeal = () => {
  return applyDecorators(
    ApiOperation({ summary: 'Cancel a deal' }),
    ApiBody({
      schema: {
        type: 'object',
        properties: {
          dealId: { type: 'string', format: 'uuid', description: 'ID of the deal to cancel' },
          userId: { type: 'string', format: 'uuid', description: 'ID of the user cancelling the deal' },
        },
        required: ['dealId', 'userId'],
      },
    }),
    ApiResponse({
      status: 200,
      description: 'Deal cancelled successfully',
      schema: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          status: { type: 'string', enum: Object.values(DealStatus) },
          message: { type: 'string' },
        },
      },
    }),
    ApiResponse({ status: 400, description: 'Bad request' }),
    ApiResponse({ status: 404, description: 'Deal not found' }),
    ApiResponse({ status: 500, description: 'Internal server error' }),
  );
};

export const ApiConfirmCompletion = () => {
  return applyDecorators(
    ApiOperation({ summary: 'Confirm completion of a deal' }),
    ApiBody({
      schema: {
        type: 'object',
        properties: {
          dealId: { type: 'string', format: 'uuid', description: 'ID of the deal to confirm completion' },
          userId: { type: 'string', format: 'uuid', description: 'ID of the user confirming completion' },
        },
        required: ['dealId', 'userId'],
      },
    }),
    ApiResponse({
      status: 200,
      description: 'Deal completion confirmed successfully',
      schema: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          status: { type: 'string', enum: Object.values(DealStatus) },
          message: { type: 'string' },
        },
      },
    }),
    ApiResponse({ status: 400, description: 'Bad request' }),
    ApiResponse({ status: 404, description: 'Deal not found' }),
    ApiResponse({ status: 500, description: 'Internal server error' }),
  );
};

export const ApiGetActiveDeals = () => {
  return applyDecorators(
    ApiOperation({ summary: 'Get active deals for a user' }),
    ApiBody({
      schema: {
        type: 'object',
        properties: {
          userId: { type: 'string', format: 'uuid', description: 'ID of the user' },
        },
        required: ['userId'],
      },
    }),
    ApiResponse({
      status: 200,
      description: 'Active deals retrieved successfully',
      schema: {
        type: 'object',
        properties: {
          deals: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string', format: 'uuid' },
                status: { type: 'string', enum: Object.values(DealStatus) },
                customer_id: { type: 'string', format: 'uuid' },
                vendor_id: { type: 'string', format: 'uuid' },
                amount: { type: 'number' },
                description: { type: 'string' },
                initiator: { type: 'string', enum: Object.values(DealInitiator) },
                funds_reserved: { type: 'boolean' },
                created_at: { type: 'string', format: 'date-time' },
                accepted_at: { type: 'string', format: 'date-time', nullable: true },
                completed_at: { type: 'string', format: 'date-time', nullable: true },
                cancelled_at: { type: 'string', format: 'date-time', nullable: true },
                cancelled_by: { type: 'string', nullable: true },
                declined_at: { type: 'string', format: 'date-time', nullable: true },
                declined_by: { type: 'string', nullable: true },
              },
            },
          },
        },
      },
    }),
    ApiResponse({ status: 400, description: 'Bad request' }),
    ApiResponse({ status: 500, description: 'Internal server error' }),
  );
};

export const ApiGetDealById = () => {
  return applyDecorators(
    ApiOperation({ summary: 'Get deal by ID' }),
    ApiBody({
      schema: {
        type: 'object',
        properties: {
          dealId: { type: 'string', format: 'uuid', description: 'ID of the deal' },
        },
        required: ['dealId'],
      },
    }),
    ApiResponse({
      status: 200,
      description: 'Deal retrieved successfully',
      schema: {
        type: 'object',
        properties: {
          deal: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              status: { type: 'string', enum: Object.values(DealStatus) },
              customer_id: { type: 'string', format: 'uuid' },
              vendor_id: { type: 'string', format: 'uuid' },
              amount: { type: 'number' },
              description: { type: 'string' },
              initiator: { type: 'string', enum: Object.values(DealInitiator) },
              funds_reserved: { type: 'boolean' },
              created_at: { type: 'string', format: 'date-time' },
              accepted_at: { type: 'string', format: 'date-time', nullable: true },
              completed_at: { type: 'string', format: 'date-time', nullable: true },
              cancelled_at: { type: 'string', format: 'date-time', nullable: true },
              cancelled_by: { type: 'string', nullable: true },
              declined_at: { type: 'string', format: 'date-time', nullable: true },
              declined_by: { type: 'string', nullable: true },
            },
          },
        },
      },
    }),
    ApiResponse({ status: 400, description: 'Bad request' }),
    ApiResponse({ status: 404, description: 'Deal not found' }),
    ApiResponse({ status: 500, description: 'Internal server error' }),
  );
};

// Декораторы для Disputes
export const ApiOpenDispute = () => {
  return applyDecorators(
    ApiOperation({ summary: 'Open a dispute for a deal' }),
    ApiBody({
      schema: {
        type: 'object',
        properties: {
          dealId: { type: 'string', format: 'uuid', description: 'ID of the deal' },
          userId: { type: 'string', format: 'uuid', description: 'ID of the user opening the dispute' },
          reason: { type: 'string', description: 'Reason for opening the dispute' },
        },
        required: ['dealId', 'userId', 'reason'],
      },
    }),
    ApiResponse({
      status: 200,
      description: 'Dispute opened successfully',
      schema: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          status: { type: 'string', enum: Object.values(DisputeStatus) },
          message: { type: 'string' },
        },
      },
    }),
    ApiResponse({ status: 400, description: 'Bad request' }),
    ApiResponse({ status: 404, description: 'Deal not found' }),
    ApiResponse({ status: 500, description: 'Internal server error' }),
  );
};

export const ApiResolveDispute = () => {
  return applyDecorators(
    ApiOperation({ summary: 'Resolve a dispute' }),
    ApiBody({
      schema: {
        type: 'object',
        properties: {
          dealId: { type: 'string', format: 'uuid', description: 'ID of the deal' },
          disputeId: { type: 'string', format: 'uuid', description: 'ID of the dispute' },
          resolution: { type: 'string', enum: ['CUSTOMER_WON', 'VENDOR_WON'], description: 'Resolution of the dispute' },
          moderatorId: { type: 'string', format: 'uuid', description: 'ID of the moderator resolving the dispute' },
        },
        required: ['dealId', 'disputeId', 'resolution', 'moderatorId'],
      },
    }),
    ApiResponse({
      status: 200,
      description: 'Dispute resolved successfully',
      schema: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          status: { type: 'string', enum: Object.values(DisputeStatus) },
          message: { type: 'string' },
        },
      },
    }),
    ApiResponse({ status: 400, description: 'Bad request' }),
    ApiResponse({ status: 404, description: 'Deal or dispute not found' }),
    ApiResponse({ status: 500, description: 'Internal server error' }),
  );
};

export const ApiGetDisputeById = () => {
  return applyDecorators(
    ApiOperation({ summary: 'Get dispute by ID' }),
    ApiBody({
      schema: {
        type: 'object',
        properties: {
          disputeId: { type: 'string', format: 'uuid', description: 'ID of the dispute' },
        },
        required: ['disputeId'],
      },
    }),
    ApiResponse({
      status: 200,
      description: 'Dispute retrieved successfully',
      schema: {
        type: 'object',
        properties: {
          dispute: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              deal_id: { type: 'string', format: 'uuid' },
              opened_by: { type: 'string', format: 'uuid' },
              opened_by_role: { type: 'string' },
              reason: { type: 'string' },
              status: { type: 'string', enum: Object.values(DisputeStatus) },
              resolved_at: { type: 'string', format: 'date-time', nullable: true },
              resolution: { type: 'string', nullable: true },
              created_at: { type: 'string', format: 'date-time' },
              updated_at: { type: 'string', format: 'date-time' },
            },
          },
        },
      },
    }),
    ApiResponse({ status: 400, description: 'Bad request' }),
    ApiResponse({ status: 404, description: 'Dispute not found' }),
    ApiResponse({ status: 500, description: 'Internal server error' }),
  );
};

export const ApiGetDisputesByDealId = () => {
  return applyDecorators(
    ApiOperation({ summary: 'Get disputes by deal ID' }),
    ApiBody({
      schema: {
        type: 'object',
        properties: {
          dealId: { type: 'string', format: 'uuid', description: 'ID of the deal' },
        },
        required: ['dealId'],
      },
    }),
    ApiResponse({
      status: 200,
      description: 'Disputes retrieved successfully',
      schema: {
        type: 'object',
        properties: {
          disputes: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string', format: 'uuid' },
                deal_id: { type: 'string', format: 'uuid' },
                opened_by: { type: 'string', format: 'uuid' },
                opened_by_role: { type: 'string' },
                reason: { type: 'string' },
                status: { type: 'string', enum: Object.values(DisputeStatus) },
                resolved_at: { type: 'string', format: 'date-time', nullable: true },
                resolution: { type: 'string', nullable: true },
                created_at: { type: 'string', format: 'date-time' },
                updated_at: { type: 'string', format: 'date-time' },
              },
            },
          },
        },
      },
    }),
    ApiResponse({ status: 400, description: 'Bad request' }),
    ApiResponse({ status: 404, description: 'Deal not found' }),
    ApiResponse({ status: 500, description: 'Internal server error' }),
  );
};

// Декораторы для Commission Settings
export const ApiGetCommissionSettings = () => {
  return applyDecorators(
    ApiOperation({ summary: 'Get current commission settings' }),
    ApiResponse({
      status: 200,
      description: 'Commission settings retrieved successfully',
      schema: {
        type: 'object',
        properties: {
          settings: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              percentage: { type: 'number', description: 'Commission percentage' },
              min_amount: { type: 'number', description: 'Minimum commission amount' },
              is_active: { type: 'boolean', description: 'Whether these settings are currently active' },
              created_at: { type: 'string', format: 'date-time' },
              updated_at: { type: 'string', format: 'date-time' },
            },
          },
        },
      },
    }),
    ApiResponse({ status: 500, description: 'Internal server error' }),
  );
};

export const ApiUpdateCommissionSettings = () => {
  return applyDecorators(
    ApiOperation({ summary: 'Update commission settings' }),
    ApiBody({
      schema: {
        type: 'object',
        properties: {
          percentage: { type: 'number', description: 'New commission percentage', minimum: 0, maximum: 100 },
          min_amount: { type: 'number', description: 'New minimum commission amount', minimum: 0 },
        },
        required: ['percentage', 'min_amount'],
      },
    }),
    ApiResponse({
      status: 200,
      description: 'Commission settings updated successfully',
      schema: {
        type: 'object',
        properties: {
          settings: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              percentage: { type: 'number' },
              min_amount: { type: 'number' },
              is_active: { type: 'boolean' },
              created_at: { type: 'string', format: 'date-time' },
              updated_at: { type: 'string', format: 'date-time' },
            },
          },
        },
      },
    }),
    ApiResponse({ status: 400, description: 'Bad request' }),
    ApiResponse({ status: 403, description: 'Forbidden - Admin access required' }),
    ApiResponse({ status: 500, description: 'Internal server error' }),
  );
};

// Декораторы для Commission Balance
export const ApiGetCommissionBalance = () => {
  return applyDecorators(
    ApiOperation({ summary: 'Get current commission balance' }),
    ApiResponse({
      status: 200,
      description: 'Commission balance retrieved successfully',
      schema: {
        type: 'object',
        properties: {
          balance: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              amount: { type: 'number', description: 'Current commission balance' },
              created_at: { type: 'string', format: 'date-time' },
              updated_at: { type: 'string', format: 'date-time' },
            },
          },
        },
      },
    }),
    ApiResponse({ status: 403, description: 'Forbidden - Admin access required' }),
    ApiResponse({ status: 500, description: 'Internal server error' }),
  );
};

export const ApiWithdrawCommission = () => {
  return applyDecorators(
    ApiOperation({ summary: 'Withdraw commission balance' }),
    ApiBody({
      schema: {
        type: 'object',
        properties: {
          amount: { type: 'number', description: 'Amount to withdraw', minimum: 0 },
          admin_id: { type: 'string', format: 'uuid', description: 'ID of the admin performing the withdrawal' },
        },
        required: ['amount', 'admin_id'],
      },
    }),
    ApiResponse({
      status: 200,
      description: 'Commission withdrawn successfully',
      schema: {
        type: 'object',
        properties: {
          balance: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              amount: { type: 'number' },
              created_at: { type: 'string', format: 'date-time' },
              updated_at: { type: 'string', format: 'date-time' },
            },
          },
          message: { type: 'string' },
        },
      },
    }),
    ApiResponse({ status: 400, description: 'Bad request - Invalid amount' }),
    ApiResponse({ status: 403, description: 'Forbidden - Admin access required' }),
    ApiResponse({ status: 500, description: 'Internal server error' }),
  );
}; 