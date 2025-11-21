import {Module} from '@nestjs/common';
import {CoverImageController} from "./cover-image.controller";
import {CoverImageService} from "./cover-image.service";
import {MulterModule} from "@nestjs/platform-express";

@Module({
    imports: [
        MulterModule.register({
            limits: {
                fileSize: 10 * 1024 * 1024, // 10MB
            },
            fileFilter: (req, file, cb) => {
                if (!file.mimetype.startsWith('image/')) {
                    return cb(new Error('Only image files are allowed'), false);
                }
                cb(null, true);
            },
        }),
    ],
    controllers: [CoverImageController],
    providers: [CoverImageService],
    exports: [CoverImageService],
})
export class CoverImageModule {
}
