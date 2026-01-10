import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IsString, IsNotEmpty, IsOptional, IsIn } from 'class-validator';

export class AssignCustomerUserDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsIn(['ADMIN', 'MANAGER', 'VIEWER'])
  @IsNotEmpty()
  role: string; // Role within the customer organization
}

export class UpdateCustomerUserRoleDto {
  @IsString()
  @IsIn(['ADMIN', 'MANAGER', 'VIEWER'])
  @IsNotEmpty()
  role: string;
}

@Injectable()
export class CustomerUsersService {
  constructor(private prisma: PrismaService) {}

  async assignUserToCustomer(
    customerId: string,
    data: AssignCustomerUserDto,
  ) {
    // Verify customer exists
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${customerId} not found`);
    }

    // Verify user exists
    const user = await this.prisma.user.findUnique({
      where: { id: data.userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${data.userId} not found`);
    }

    // Check if assignment already exists
    const existing = await this.prisma.customerUser.findUnique({
      where: {
        userId_customerId: {
          userId: data.userId,
          customerId: customerId,
        },
      },
    });

    if (existing) {
      throw new BadRequestException(
        `User ${data.userId} is already assigned to customer ${customer.companyName}`,
      );
    }

    return this.prisma.customerUser.create({
      data: {
        userId: data.userId,
        customerId: customerId,
        role: data.role,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
        customer: {
          select: {
            id: true,
            companyName: true,
            type: true,
          },
        },
      },
    });
  }

  async listCustomerUsers(customerId: string) {
    // Verify customer exists
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${customerId} not found`);
    }

    return this.prisma.customerUser.findMany({
      where: { customerId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async listUserCustomers(userId: string) {
    // Verify user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    return this.prisma.customerUser.findMany({
      where: { userId },
      include: {
        customer: {
          select: {
            id: true,
            companyName: true,
            type: true,
            status: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async updateCustomerUserRole(
    customerId: string,
    userId: string,
    data: UpdateCustomerUserRoleDto,
  ) {
    const customerUser = await this.prisma.customerUser.findUnique({
      where: {
        userId_customerId: {
          userId: userId,
          customerId: customerId,
        },
      },
    });

    if (!customerUser) {
      throw new NotFoundException(
        `Customer user assignment not found for customer ${customerId} and user ${userId}`,
      );
    }

    return this.prisma.customerUser.update({
      where: {
        userId_customerId: {
          userId: userId,
          customerId: customerId,
        },
      },
      data: {
        role: data.role,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
        customer: {
          select: {
            id: true,
            companyName: true,
            type: true,
          },
        },
      },
    });
  }

  async removeUserFromCustomer(
    customerId: string,
    userId: string,
  ): Promise<void> {
    const customerUser = await this.prisma.customerUser.findUnique({
      where: {
        userId_customerId: {
          userId: userId,
          customerId: customerId,
        },
      },
    });

    if (!customerUser) {
      throw new NotFoundException(
        `Customer user assignment not found for customer ${customerId} and user ${userId}`,
      );
    }

    await this.prisma.customerUser.delete({
      where: {
        userId_customerId: {
          userId: userId,
          customerId: customerId,
        },
      },
    });
  }
}

