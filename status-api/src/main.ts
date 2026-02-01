import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConsoleLogger, Logger, ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: new ConsoleLogger({ json: false, context: 'StatusAPI' }),
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const logger = new Logger(bootstrap.name);
  logger.log('Starting Status API...');

  await app.listen(process.env.PORT ?? 3200);
  
  logger.log(`Listening on port ${process.env.PORT ?? 3200}`);
}
bootstrap();
