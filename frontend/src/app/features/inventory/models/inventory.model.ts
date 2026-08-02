import { LocationType, StockStatus } from '../../../core/models/api-enums.model';

export interface InventoryProductSummaryResponse {
	id: number;
	sku: string;
	name: string;
	unitOfMeasure: string;
	reorderThreshold: number;
}

export interface InventoryLocationSummaryResponse {
	id: number;
	name: string;
	type: LocationType;
}

export interface InventoryResponse {
	id: number;
	product: InventoryProductSummaryResponse;
	location: InventoryLocationSummaryResponse;
	quantityOnHand: number;
	stockStatus: StockStatus;
	updatedAt: string;
}
