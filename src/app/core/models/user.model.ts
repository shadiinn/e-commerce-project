export type UserRole = 'customer' | 'admin';
 
export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
  profileImage?: string | null;
  role?: UserRole;
  // Missing on older records means the account is active.
  active?: boolean;
}
 