import { UserRole } from './user.model';
 
export interface AuthUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  profileImage?: string | null;
  role?: UserRole;
}
 