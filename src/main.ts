import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as express from 'express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.enableCors({
    origin: ['https://abai-jataqana.kz', 'http://localhost:4200'],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  });

  app.use('/public', express.static(join(process.cwd(), 'public')));

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
