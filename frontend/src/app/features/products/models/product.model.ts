import { LocationType, StockStatus } from '../../../core/models/api-enums.model';

export interface ProductCategoryResponse {
	id: number;
	name: string;
}

export interface ProductInventorySummaryResponse {
	locationId: number;
	locationName: string;
	locationType: LocationType;
	quantityOnHand: number;
	stockStatus: StockStatus;
}

export interface ProductResponse {
	id: number;
	sku: string;
	name: string;
	description: string | null;
	category: ProductCategoryResponse;
	unitOfMeasure: string;
	reorderThreshold: number;
	active: boolean;
	createdAt: string;
	updatedAt: string;
}

export interface ProductDetailResponse extends ProductResponse {
	inventory: ProductInventorySummaryResponse[];
}

export interface ProductCreateRequest {
	sku: string;
	name: string;
	description?: string;
	categoryId: number;
	unitOfMeasure: string;
	reorderThreshold?: number;
}

export interface ProductUpdateRequest {
	name: string;
	description?: string;
	categoryId: number;
	unitOfMeasure: string;
	reorderThreshold?: number;
}
