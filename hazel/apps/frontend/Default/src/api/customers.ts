import { apiClient } from './client';

export enum CustomerType {
  RETAIL = 'RETAIL',
  B2B = 'B2B',
  WHOLESALE = 'WHOLESALE',
}

export enum CustomerStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
}

export interface Customer {
  id: string;
  type: CustomerType;
  companyName: string;
  status: CustomerStatus;
  createdAt: string;
  updatedAt: string;
  _count?: {
    orders: number;
    customerUsers: number;
  };
  orders?: Array<{
    id: string;
    orderNumber: string;
    status: string;
    totalAmount: number;
    currency: string;
    createdAt: string;
  }>;
  customerUsers?: Array<{
    id: string;
    userId: string;
    customerId: string;
    role: string;
    user?: {
      id: string;
      email: string;
    };
  }>;
}

export interface CreateCustomerDto {
  type: CustomerType;
  companyName: string;
  status?: CustomerStatus;
}

export interface UpdateCustomerDto {
  companyName?: string;
  status?: CustomerStatus;
}

class CustomersAPI {
  private basePath = '/customers';

  async listCustomers(): Promise<Customer[]> {
    return apiClient.get<Customer[]>(this.basePath);
  }

  async getCustomerById(id: string): Promise<Customer> {
    return apiClient.get<Customer>(`${this.basePath}/${id}`);
  }

  async createCustomer(data: CreateCustomerDto): Promise<Customer> {
    return apiClient.post<Customer>(this.basePath, data);
  }

  async updateCustomer(id: string, data: UpdateCustomerDto): Promise<Customer> {
    return apiClient.put<Customer>(`${this.basePath}/${id}`, data);
  }

  async deleteCustomer(id: string): Promise<void> {
    return apiClient.delete<void>(`${this.basePath}/${id}`);
  }
}

export const customersAPI = new CustomersAPI();

