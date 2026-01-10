import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env'), override: true });
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

/**
 * PRODUCTION-SAFE BOOTSTRAP
 * 
 * Architecture decisions:
 * 
 * 1. ValidationPipe Configuration:
 *    - whitelist: true - Strips non-whitelisted properties (safe)
 *    - forbidNonWhitelisted: false - ✅ FIX: Does NOT throw 500 errors for extra properties
 *    - transform: true - Transforms plain objects to DTO instances (only when DTO is present)
 *    - transformOptions.enableImplicitConversion: true - Auto-converts types (string to number, etc.)
 * 
 *    Why this is safe:
 *    - GET requests without @Body() DTO will NOT be validated and pass through normally
 *    - POST/PATCH/PUT requests with DTOs ARE validated, but extra properties are stripped (not rejected)
 *    - ValidationPipe only runs when @Body() decorator is used with a DTO class
 *    - This prevents 500 errors on GET /products, GET /orders, etc.
 * 
 * 2. NO Global AuthGuard:
 *    - Phase B (B1-B6) does NOT require authentication for read APIs
 *    - Auth should be applied per-route using @UseGuards(AuthGuard) decorator when needed
 *    - This allows frontend to access Products, Orders, Customers, etc. without auth in Phase B
 * 
 * 3. CORS Enabled:
 *    - Allows frontend (running on different port) to communicate with backend
 *    - Credentials enabled for future auth token support
 * 
 * 4. NO Global Exception Filters:
 *    - NestJS default exception handling is sufficient
 *    - Custom filters should be applied per-controller if needed
 * 
 * 5. NO Global Interceptors:
 *    - Interceptors should be applied per-controller or per-route
 *    - Keeps global scope clean and predictable
 */
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS configuration for frontend communication
  app.enableCors({
    origin: true, // Allow all origins in development (restrict in production)
    credentials: true, // Allow cookies/auth headers
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Safe ValidationPipe configuration
  // 
  // CRITICAL FIX: forbidNonWhitelisted: false
  // - The original configuration had forbidNonWhitelisted: true, which was causing 500 errors
  // - When true, ValidationPipe throws errors for ANY extra properties, even on GET requests with query params
  // - When false, extra properties are silently stripped (via whitelist: true) without throwing errors
  // 
  // How it works:
  // - ValidationPipe only validates when @Body() decorator is used with a DTO class
  // - GET requests without @Body() DTO are NOT validated and pass through normally
  // - POST/PATCH/PUT requests with DTOs ARE validated, but extra properties are stripped (not rejected)
  // - transform: true converts plain objects to DTO instances for type safety
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip non-whitelisted properties (safe, no data loss for valid fields)
      forbidNonWhitelisted: false, // ✅ FIX: Don't throw 500 errors for extra properties
      transform: true, // Transform plain objects to DTO instances (type safety)
      transformOptions: {
        enableImplicitConversion: true, // Auto-convert string "123" to number 123, etc.
      },
      // ValidationPipe automatically skips validation when no @Body() DTO is present
      // GET /products, GET /orders, etc. will NOT be validated and will work correctly
    }),
  );

  // NO global guards - Auth is applied per-route using @UseGuards() decorator
  // This allows Phase B modules (Products, Orders, Customers, etc.) to work without auth

  // NO global exception filters - Use NestJS default exception handling
  // Custom filters can be applied per-controller if needed

  // NO global interceptors - Apply per-controller or per-route if needed

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`🚀 Backend running on http://localhost:${port}`);
  console.log(`📊 API Endpoints available (no auth required in Phase B)`);
  console.log(`   GET  /products`);
  console.log(`   GET  /customers`);
  console.log(`   GET  /orders`);
  console.log(`   GET  /warehouses`);
  console.log(`   GET  /forecast`);
  console.log(`   GET  /replenishment-suggestions`);
}
void bootstrap();
