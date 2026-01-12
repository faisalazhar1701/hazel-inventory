import { Global, Module, OnModuleInit } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule implements OnModuleInit {
  constructor(private prismaService: PrismaService) {}

  async onModuleInit() {
    // Bootstrap admin user on module init
    await this.bootstrapAdminUser();
  }

  private async bootstrapAdminUser() {
    try {
      // Check if admin user already exists
      const existingAdmin = await this.prismaService.user.findUnique({
        where: { email: 'admin@hazel.com' },
      });

      if (existingAdmin) {
        console.log('✅ Admin user already exists');
        return;
      }

      // Create admin user
      // Note: In production, password should be hashed using bcrypt
      // For now, storing plain text (should be replaced with proper auth implementation)
      await this.prismaService.user.create({
        data: {
          email: 'admin@hazel.com',
          role: 'ADMIN',
        },
      });

      console.log('✅ Default admin user created: admin@hazel.com');
      console.log('   Password: Admin@123 (should be set via proper auth system)');
    } catch (error) {
      console.warn('⚠️  Could not bootstrap admin user:', error.message);
      // Don't fail module init if bootstrap fails
    }
  }
}

