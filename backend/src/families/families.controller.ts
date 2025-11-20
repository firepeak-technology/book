import { Controller, Get, Post, Body, Param, UseGuards, Delete } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { FamiliesService } from './families.service';
import { CreateFamilyDto } from './dto/create-family.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('families')
@Controller('families')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class FamiliesController {
  constructor(private readonly familiesService: FamiliesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new family' })
  async create(@CurrentUser() user, @Body() createFamilyDto: CreateFamilyDto) {
    return this.familiesService.create(user.id, createFamilyDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get family details' })
  async findOne(@Param('id') id: string) {
    return this.familiesService.findOne(id);
  }

  @Post('join/:familyId')
  @ApiOperation({ summary: 'Join a family' })
  async joinFamily(@CurrentUser() user, @Param('familyId') familyId: string) {
    return this.familiesService.joinFamily(user.id, familyId);
  }

  @Delete('leave')
  @ApiOperation({ summary: 'Leave current family' })
  async leaveFamily(@CurrentUser() user) {
    return this.familiesService.leaveFamily(user.id);
  }
}
