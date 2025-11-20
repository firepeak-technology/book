import {Module} from '@nestjs/common';
import {ConfigModule} from '@nestjs/config';
import {AuthModule} from './auth/auth.module';
import {UsersModule} from './users/users.module';
import {BooksModule} from './books/books.module';
import {FamiliesModule} from './families/families.module';
import {PrismaModule} from './prisma/prisma.module';
import {CategoriesModule} from "./categories/categories.module";
import {CollectionsModule} from "./collections/collections.module";

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
        }),
        PrismaModule,
        AuthModule,
        UsersModule,
        BooksModule,
        FamiliesModule,
        CategoriesModule,
        CollectionsModule,
    ],
})
export class AppModule {
}
