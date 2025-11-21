import {Module} from '@nestjs/common';
import {ConfigModule, ConfigService} from '@nestjs/config';
import {AuthModule} from './auth/auth.module';
import {UsersModule} from './users/users.module';
import {BooksModule} from './books/books.module';
import {PrismaModule} from './prisma/prisma.module';
import {CategoriesModule} from "./categories/categories.module";
import {SeriesModule} from "./series/series.module";
import {CoverImageModule} from "./image/cover-image.module";
import {ServeStaticModule} from '@nestjs/serve-static';


@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
        }),
        ServeStaticModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => [{
                rootPath: '/app/uploads',
                serveRoot: '/uploads/covers',
            }],
        }),
        PrismaModule,
        AuthModule,
        UsersModule,
        BooksModule,
        CategoriesModule,
        SeriesModule,
        CoverImageModule
    ],
})
export class AppModule {
}
