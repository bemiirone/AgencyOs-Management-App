import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_CONFIG } from '../config/api.config';
import { UserWithRole, CreateUserDto, UpdateUserDto } from '../../stores/user.store';

@Injectable({
  providedIn: 'root',
})
export class UserAdminService {
  private http = inject(HttpClient);

  findAll(): Observable<UserWithRole[]> {
    return this.http.get<UserWithRole[]>(`${API_CONFIG.baseUrl}${API_CONFIG.USERS.LIST}`);
  }

  findOne(id: string): Observable<UserWithRole> {
    return this.http.get<UserWithRole>(`${API_CONFIG.baseUrl}${API_CONFIG.USERS.DETAIL(id)}`);
  }

  create(dto: CreateUserDto): Observable<UserWithRole> {
    return this.http.post<UserWithRole>(`${API_CONFIG.baseUrl}${API_CONFIG.USERS.CREATE}`, dto);
  }

  update(id: string, dto: UpdateUserDto): Observable<UserWithRole> {
    return this.http.patch<UserWithRole>(`${API_CONFIG.baseUrl}${API_CONFIG.USERS.UPDATE(id)}`, dto);
  }

  updateRole(id: string, role: string): Observable<UserWithRole> {
    return this.http.patch<UserWithRole>(`${API_CONFIG.baseUrl}${API_CONFIG.USERS.UPDATE_ROLE(id)}`, { role });
  }

  softDelete(id: string): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(`${API_CONFIG.baseUrl}${API_CONFIG.USERS.DELETE(id)}`);
  }

  reactivate(id: string): Observable<UserWithRole> {
    return this.http.patch<UserWithRole>(`${API_CONFIG.baseUrl}${API_CONFIG.USERS.REACTIVATE(id)}`, {});
  }
}
