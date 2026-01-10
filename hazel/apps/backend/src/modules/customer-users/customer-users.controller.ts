import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  CustomerUsersService,
  AssignCustomerUserDto,
  UpdateCustomerUserRoleDto,
} from './customer-users.service';

@Controller('customers')
export class CustomerUsersController {
  constructor(private readonly customerUsersService: CustomerUsersService) {}

  @Post(':customerId/users')
  @HttpCode(HttpStatus.CREATED)
  async assignUserToCustomer(
    @Param('customerId') customerId: string,
    @Body() assignCustomerUserDto: AssignCustomerUserDto,
  ) {
    return this.customerUsersService.assignUserToCustomer(
      customerId,
      assignCustomerUserDto,
    );
  }

  @Get(':customerId/users')
  async listCustomerUsers(@Param('customerId') customerId: string) {
    return this.customerUsersService.listCustomerUsers(customerId);
  }

  @Get('users/:userId/customers')
  async listUserCustomers(@Param('userId') userId: string) {
    return this.customerUsersService.listUserCustomers(userId);
  }

  @Put(':customerId/users/:userId/role')
  @HttpCode(HttpStatus.OK)
  async updateCustomerUserRole(
    @Param('customerId') customerId: string,
    @Param('userId') userId: string,
    @Body() updateCustomerUserRoleDto: UpdateCustomerUserRoleDto,
  ) {
    return this.customerUsersService.updateCustomerUserRole(
      customerId,
      userId,
      updateCustomerUserRoleDto,
    );
  }

  @Delete(':customerId/users/:userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeUserFromCustomer(
    @Param('customerId') customerId: string,
    @Param('userId') userId: string,
  ) {
    await this.customerUsersService.removeUserFromCustomer(
      customerId,
      userId,
    );
  }
}

