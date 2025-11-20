import {Module} from '@nestjs/common';
import {BooksService} from './books.service';
import {BooksController} from './books.controller';
import {CategoriesModule} from "../categories/categories.module";
import {CollectionsModule} from "../collections/collections.module";

@Module({
    imports: [CategoriesModule, CollectionsModule],
    controllers: [BooksController],
    providers: [BooksService],
    exports: [BooksService],
})
export class BooksModule {
}
