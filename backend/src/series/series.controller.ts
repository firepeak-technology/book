import {Body, Controller, Delete, Get, Param, Post, Put, UseGuards} from '@nestjs/common';
import {ApiBearerAuth, ApiTags} from '@nestjs/swagger';
import {SeriesService} from './series.service';
import {CreateSeriesDto, UpdateSeriesDto} from './dto/series.dto';
import {AuthGuard} from "@nestjs/passport";
import {CurrentUser} from "../auth/decorators/current-user.decorator";

@ApiTags('series')
@Controller('series')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class SeriesController {
    constructor(private readonly seriesService: SeriesService) {
    }

    @Get()
    async findAll(@CurrentUser() user) {
        return this.seriesService.findAll();
    }

    @Get('me')
    async getMySeries(@CurrentUser() user: any) {
        return this.seriesService.getMySeriesWithCounts(user.id);
    }

    @Get(':id')
    async findOne(@Param('id') id: string, @CurrentUser() user: any) {
        return this.seriesService.findOne(id, user.id);
    }

    @Post()
    async create(@Body() createSeriesDto: CreateSeriesDto, @CurrentUser() user: any) {
        return this.seriesService.create(createSeriesDto, user.id);
    }

    @Put(':id')
    async update(
        @Param('id') id: string,
        @Body() updateSeriesDto: UpdateSeriesDto,
        @CurrentUser() user: any,
    ) {
        return this.seriesService.update(id, updateSeriesDto, user.id);
    }

    @Delete(':id')
    async remove(@Param('id') id: string, @CurrentUser() user: any) {
        return this.seriesService.remove(id, user.id);
    }
}
