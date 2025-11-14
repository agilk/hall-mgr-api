import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global prefix
  app.setGlobalPrefix('api');

  // Enable CORS
  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:8080',
    credentials: true,
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
    .setTitle('Exam Supervision API')
    .setDescription('API documentation for the Exam Supervision Web Application')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', 'Authentication endpoints')
    .addTag('users', 'User management')
    .addTag('supervisors', 'Supervisor management')
    .addTag('buildings', 'Building management')
    .addTag('halls', 'Hall management')
    .addTag('rooms', 'Room management')
    .addTag('assignments', 'Assignment management')
    .addTag('exams', 'Exam management')
    .addTag('monitoring', 'Real-time monitoring')
    .addTag('feedback', 'Feedback system')
    .addTag('notifications', 'Notification system')
    .addTag('statistics', 'Statistics and reports')
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
