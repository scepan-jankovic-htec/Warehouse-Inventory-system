export interface CategoryResponse {
	id: number;
	name: string;
	description: string | null;
	active: boolean;
	productCount: number;
	createdAt: string;
	updatedAt: string;
}

export interface CategoryCreateRequest {
	name: string;
	description?: string;
}

export interface CategoryUpdateRequest {
	name: string;
	description?: string;
}
