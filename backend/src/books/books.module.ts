import {Module} from '@nestjs/common';
import {BooksService} from './books.service';
import {BooksController} from './books.controller';
import {CategoriesModule} from "../categories/categories.module";
import {SeriesModule} from "../series/series.module";
import {CoverImageModule} from "../image/cover-image.module";

@Module({
    imports: [CategoriesModule, SeriesModule, CoverImageModule],
    controllers: [BooksController],
    providers: [BooksService],
    exports: [BooksService],
})
export class BooksModule {
}
