import {
    BadRequestException,
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Post,
    UploadedFile,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common';
import {FileInterceptor} from '@nestjs/platform-express';
import {CoverImageService} from './cover-image.service';
import {DownloadCoverImageDto} from './dto/cover-image.dto';
// ===================================
// cover-image.dto.ts
// ===================================
import {AuthGuard} from "@nestjs/passport";
import {ApiBearerAuth, ApiTags} from "@nestjs/swagger";
import {CurrentUser} from "../auth/decorators/current-user.decorator";

@ApiTags('books')
@Controller('cover-images')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class CoverImageController {
    constructor(private readonly coverImageService: CoverImageService) {
    }

    @Post('upload')
    @UseInterceptors(FileInterceptor('file'))
    async uploadFile(
        @UploadedFile() file: Express.Multer.File,
        @CurrentUser() user: any,
    ) {
        if (!file) {
            throw new BadRequestException('No file uploaded');
        }

        return this.coverImageService.uploadFromFile(file);
    }

    @Post('download')
    async downloadFromUrl(
        @Body() downloadDto: DownloadCoverImageDto,
        @CurrentUser() user: any,
    ) {
        return this.coverImageService.downloadFromUrl(downloadDto.url);
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        return this.coverImageService.findOne(id);
    }

    @Delete(':id')
    async remove(@Param('id') id: string, @CurrentUser() user: any) {
        return this.coverImageService.remove(id);
    }
}
