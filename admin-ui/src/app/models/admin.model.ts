export interface AdminUser {
  id: string;
  email: string;
  role: string;
}

export interface AdminLoginResponse {
  admin: AdminUser;
  accessToken: string;
}

export interface AdminLoginRequest {
  email: string;
  password: string;
}
