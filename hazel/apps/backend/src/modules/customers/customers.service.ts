import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CustomerType } from '@hazel/shared-types';
import { IsString, IsNotEmpty, IsOptional, IsEnum, IsIn } from 'class-validator';

export class CreateCustomerDto {
  @IsEnum(['RETAIL', 'B2B', 'WHOLESALE'])
  @IsNotEmpty()
  type: CustomerType;

  @IsString()
  @IsNotEmpty()
  companyName: string;

  @IsString()
  @IsIn(['ACTIVE', 'INACTIVE', 'SUSPENDED'])
  @IsOptional()
  status?: string;
}

export class UpdateCustomerDto {
  @IsString()
  @IsOptional()
  companyName?: string;

  @IsString()
  @IsIn(['ACTIVE', 'INACTIVE', 'SUSPENDED'])
  @IsOptional()
  status?: string;
}

@Injectable()
export class CustomersService {
  constructor(private prisma: PrismaService) {}

  async createCustomer(data: CreateCustomerDto) {
    return this.prisma.customer.create({
      data: {
        type: data.type,
        companyName: data.companyName,
        status: data.status || 'ACTIVE',
      },
    });
  }

  /**
   * List customers with optional filtering for role-based access
   * @param userId - Optional user ID to filter customers. If provided, only returns customers assigned to that user.
   */
  async listCustomers(userId?: string) {
    const where = userId
      ? {
          customerUsers: {
            some: {
              userId: userId,
            },
          },
        }
      : {};

    return this.prisma.customer.findMany({
      where,
      orderBy: {
        companyName: 'asc',
      },
      include: {
        _count: {
          select: {
            orders: true,
            customerUsers: true,
          },
        },
      },
    });
  }

  /**
   * Get customer by ID with optional user access check
   * @param id - Customer ID
   * @param userId - Optional user ID to verify access. If provided, only returns customer if user is assigned to it.
   */
  async getCustomerById(id: string, userId?: string) {
    const where: any = { id };
    
    // If userId is provided, ensure user has access to this customer
    if (userId) {
      const customerUser = await this.prisma.customerUser.findUnique({
        where: {
          userId_customerId: {
            userId: userId,
            customerId: id,
          },
        },
      });
      
      if (!customerUser) {
        throw new NotFoundException(
          `Customer with ID ${id} not found or you do not have access to it`,
        );
      }
    }

    const customer = await this.prisma.customer.findUnique({
      where,
      include: {
        orders: {
          select: {
            id: true,
            orderNumber: true,
            status: true,
            totalAmount: true,
            currency: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 10, // Limit to recent orders for performance
        },
        customerUsers: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
              },
            },
          },
        },
        _count: {
          select: {
            orders: true,
            customerUsers: true,
          },
        },
      },
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${id} not found`);
    }

    return customer;
  }

  async updateCustomer(id: string, data: UpdateCustomerDto) {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${id} not found`);
    }

    return this.prisma.customer.update({
      where: { id },
      data: {
        companyName: data.companyName,
        status: data.status,
      },
    });
  }

  async deleteCustomer(id: string): Promise<void> {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            orders: true,
            customerUsers: true,
          },
        },
      },
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${id} not found`);
    }

    // Prevent deletion if customer has orders
    if (customer._count.orders > 0) {
      throw new BadRequestException(
        `Cannot delete customer with ID ${id}. Customer has ${customer._count.orders} order(s) associated with it.`,
      );
    }

    await this.prisma.customer.delete({
      where: { id },
    });
  }
}

