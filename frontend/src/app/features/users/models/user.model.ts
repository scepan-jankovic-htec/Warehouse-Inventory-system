import { UserRole } from '../../../core/models/api-enums.model';

export interface UserResponse {
	id: number;
	username: string;
	fullName: string;
	email: string;
	role: UserRole;
	active: boolean;
	createdAt: string;
	updatedAt: string;
}

export interface UserCreateRequest {
	username: string;
	password: string;
	fullName: string;
	email: string;
	role: UserRole;
}

export interface UserUpdateRequest {
	fullName: string;
	email: string;
	role: UserRole;
}
