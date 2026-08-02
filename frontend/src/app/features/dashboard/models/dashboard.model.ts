import { LocationType, MovementType } from '../../../core/models/api-enums.model';

export interface DashboardRecentMovementResponse {
	id: number;
	movementType: MovementType;
	productName: string;
	locationName: string;
	quantityDelta: number;
	performedAt: string;
}

export interface DashboardSummaryResponse {
	totalActiveProducts: number;
	totalActiveLocations: number;
	lowStockCount: number;
	outOfStockCount: number;
	recentMovements: DashboardRecentMovementResponse[];
}

export interface StockHealthLocationResponse {
	id: number;
	name: string;
	type: LocationType;
}

export interface StockHealthResponse {
	location: StockHealthLocationResponse;
	inStockCount: number;
	lowStockCount: number;
	outOfStockCount: number;
}
