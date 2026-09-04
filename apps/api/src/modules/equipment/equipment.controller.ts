import {
  Controller, Get, Post, Put, Delete, Body, Param, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { EquipmentService } from './equipment.service';
import { CreateEquipmentDto } from './dto/create-equipment.dto';
import { UpdateEquipmentDto } from './dto/update-equipment.dto';
import { RetireEquipmentDto } from './dto/retire-equipment.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';

@Controller('equipment')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EquipmentController {
  constructor(private equipment: EquipmentService) {}

  @Get('available')
  async findAvailable(@CurrentUser() user: AuthenticatedUser) {
    return this.equipment.findAvailable(user.orgId);
  }

  @Get('logs')
  async getAllLogs(@CurrentUser() user: AuthenticatedUser) {
    return this.equipment.getAllLogs(user.orgId);
  }

  @Get()
  async findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.equipment.findAll(user.orgId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.equipment.findOne(id, user.orgId);
  }

  @Post()
  @Roles('owner')
  async create(@Body() dto: CreateEquipmentDto, @CurrentUser() user: AuthenticatedUser) {
    return this.equipment.create(dto, user.orgId);
  }

  @Put(':id')
  @Roles('owner')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateEquipmentDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.equipment.update(id, dto, user.orgId);
  }

  @Delete(':id')
  @Roles('owner')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    await this.equipment.remove(id, user.orgId);
  }

  @Post(':id/retire')
  @Roles('owner')
  async retire(
    @Param('id') id: string,
    @Body() dto: RetireEquipmentDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.equipment.retire(id, dto, user.id, user.orgId);
  }

  @Get(':id/logs')
  async getLogs(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.equipment.getLogs(id, user.orgId);
  }

  @Post(':id/restore')
  @Roles('owner')
  async restore(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.equipment.restore(id, user.orgId);
  }
}
