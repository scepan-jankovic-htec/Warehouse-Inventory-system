import { LocationType, MovementType } from '../../../core/models/api-enums.model';

export interface MovementProductSummaryResponse {
	id: number;
	sku: string;
	name: string;
}

export interface MovementLocationSummaryResponse {
	id: number;
	name: string;
	type: LocationType;
}

export interface TransferLocationSummaryResponse {
	id: number;
	name: string;
}

export interface MovementPerformedByResponse {
	id: number;
	username: string;
	fullName: string;
}

export interface MovementResponse {
	id: number;
	movementType: MovementType;
	product: MovementProductSummaryResponse;
	location: MovementLocationSummaryResponse;
	quantityDelta: number;
	referenceId: string | null;
	reason: string | null;
	transferCounterpartId: number | null;
	performedBy: MovementPerformedByResponse;
	performedAt: string;
}

export interface MovementOperationResponse {
	id: number;
	movementType: MovementType;
	product: MovementProductSummaryResponse;
	location: MovementLocationSummaryResponse;
	quantityDelta: number;
	quantityAfter: number;
	referenceId: string | null;
	reason: string | null;
	performedBy: MovementPerformedByResponse;
	performedAt: string;
}

export interface TransferMovementResponse {
	id: number;
	movementType: Extract<MovementType, 'TRANSFER_OUT' | 'TRANSFER_IN'>;
	location: TransferLocationSummaryResponse;
	quantityDelta: number;
	quantityAfter: number;
	performedAt: string;
}

export interface TransferResponseEnvelope {
	transferId: string;
	outboundMovement: TransferMovementResponse;
	inboundMovement: TransferMovementResponse;
	product: MovementProductSummaryResponse;
	performedBy: MovementPerformedByResponse;
}

// ── Request models ────────────────────────────────────────────────────

export interface ReceiveRequest {
	productId: number;
	locationId: number;
	quantity: number;
	referenceId?: string;
	reason?: string;
}

export interface TransferRequest {
	productId: number;
	sourceLocationId: number;
	destinationLocationId: number;
	quantity: number;
	referenceId?: string;
	reason?: string;
}

export interface AdjustmentRequest {
	productId: number;
	locationId: number;
	quantityDelta: number;
	reason: string;
	referenceId?: string;
}
