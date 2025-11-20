import {NestFactory} from '@nestjs/core';
import {ValidationPipe} from '@nestjs/common';
import {DocumentBuilder, SwaggerModule} from '@nestjs/swagger';
import {AppModule} from './app.module';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    // app.setGlobalPrefix();

    app.enableCors({
        origin: process.env.FRONTEND_URL || 'http://localhost',
        credentials: true,
    });

    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            transform: true,
        }),
    );

    const config = new DocumentBuilder()
        .setTitle('Book Collection API')
        .setDescription('API for managing book collections')
        .setVersion('1.0')
        .addBearerAuth()
        .build();
    const document = SwaggerModule.createDocument(app, config);

    const docsUrl = process.env.NODE_ENV === 'development' ? 'docs' : 'api/docs';
    SwaggerModule.setup(docsUrl, app, document);
    const port = process.env.PORT || 3000;
    await app.listen(port);
    console.log(`Application is running on: http://localhost:${port}`);
}

bootstrap();
