import { LocationType } from '../../../core/models/api-enums.model';

export interface LocationResponse {
	id: number;
	name: string;
	type: LocationType;
	address: string | null;
	active: boolean;
	createdAt: string;
	updatedAt: string;
}
