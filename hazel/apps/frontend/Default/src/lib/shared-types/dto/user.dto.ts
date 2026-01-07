import { UserRole } from '../enums/UserRole';

export interface UserDto {
  id: string;
  email: string;
  role: UserRole;
}

