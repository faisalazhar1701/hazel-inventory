import { apiClient } from './client';

export enum CustomerUserRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  VIEWER = 'VIEWER',
}

export interface CustomerUser {
  id: string;
  userId: string;
  customerId: string;
  role: CustomerUserRole;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    email: string;
    role?: string;
  };
  customer?: {
    id: string;
    companyName: string;
    type: string;
  };
}

export interface AssignCustomerUserDto {
  userId: string;
  role: CustomerUserRole;
}

export interface UpdateCustomerUserRoleDto {
  role: CustomerUserRole;
}

class CustomerUsersAPI {
  private basePath = '/customers';

  async assignUserToCustomer(customerId: string, data: AssignCustomerUserDto): Promise<CustomerUser> {
    return apiClient.post<CustomerUser>(`${this.basePath}/${customerId}/users`, data);
  }

  async listCustomerUsers(customerId: string): Promise<CustomerUser[]> {
    return apiClient.get<CustomerUser[]>(`${this.basePath}/${customerId}/users`);
  }

  async listUserCustomers(userId: string): Promise<CustomerUser[]> {
    return apiClient.get<CustomerUser[]>(`${this.basePath}/users/${userId}/customers`);
  }

  async updateCustomerUserRole(
    customerId: string,
    userId: string,
    data: UpdateCustomerUserRoleDto,
  ): Promise<CustomerUser> {
    return apiClient.put<CustomerUser>(`${this.basePath}/${customerId}/users/${userId}/role`, data);
  }

  async removeUserFromCustomer(customerId: string, userId: string): Promise<void> {
    return apiClient.delete<void>(`${this.basePath}/${customerId}/users/${userId}`);
  }
}

export const customerUsersAPI = new CustomerUsersAPI();

