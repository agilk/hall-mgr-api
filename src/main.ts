import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security: Helmet middleware for security headers
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: [`'self'`],
          styleSrc: [`'self'`, `'unsafe-inline'`],
          scriptSrc: [`'self'`, `'unsafe-inline'`, `'unsafe-eval'`],
          imgSrc: [`'self'`, 'data:', 'https:'],
        },
      },
      crossOriginEmbedderPolicy: false,
    }),
  );

  // Global prefix
  app.setGlobalPrefix('api');

  // Enable CORS
  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:8080',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['X-Total-Count', 'X-Page', 'X-Per-Page'],
    maxAge: 3600,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Exam Supervision Management API')
    .setDescription(
      'Comprehensive API for managing exam supervisors, assignments, attendance, and real-time monitoring.\n\n' +
      '## Features\n' +
      '- JWT Authentication with 2FA support\n' +
      '- Automated data synchronization with external exam systems\n' +
      '- Real-time attendance and violation tracking\n' +
      '- Comprehensive audit logging\n\n' +
      '## Authentication\n' +
      'Most endpoints require JWT authentication. Use the `/auth/login` endpoint to obtain an access token.\n' +
      'Include the token in the `Authorization` header as `Bearer <token>`.'
    )
    .setVersion('1.0')
    .setContact(
      'API Support',
      'https://github.com/your-org/hall-mgr-api',
      'support@example.com'
    )
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth'
    )
    .addTag('auth', 'Authentication and authorization')
    .addTag('users', 'User management and profiles')
    .addTag('buildings', 'Exam building management')
    .addTag('halls', 'Exam hall management')
    .addTag('rooms', 'Exam room management')
    .addTag('exams', 'Exam scheduling and status')
    .addTag('assignments', 'Supervisor-to-room assignments')
    .addTag('attendance', 'Participant attendance tracking')
    .addTag('violations', 'Exam rule violation reporting')
    .addTag('feedback', 'Two-way communication system')
    .addTag('notifications', 'System notifications')
    .addTag('documents', 'Document and file management')
    .addTag('audit-logs', 'System audit trail')
    .addTag('sync', 'External system synchronization')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`
    🚀 Application is running on: http://localhost:${port}/api
    📚 Swagger documentation: http://localhost:${port}/api/docs
  `);
}

bootstrap();
