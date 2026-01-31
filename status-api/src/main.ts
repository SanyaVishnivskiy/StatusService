import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConsoleLogger, Logger, LoggerService } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: new ConsoleLogger({ json: false, context: 'StatusAPI' }),
  });

  const logger = new Logger(bootstrap.name);
  logger.log('Starting Status API...');

  await app.listen(process.env.PORT ?? 3000);
  
  logger.log(`Listening on port ${process.env.PORT ?? 3000}`);
}
bootstrap();
