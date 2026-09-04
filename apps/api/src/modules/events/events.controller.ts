import {
  Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import type { EventStatus } from '@prisma/client';

@Controller('events')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EventsController {
  constructor(private events: EventsService) {}

  @Get('count')
  async getCount(
    @Query('status') status: string | undefined,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.events.getCount(user.orgId, status as EventStatus | undefined);
  }

  @Get()
  async findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.events.findAll(user.id, user.role, user.orgId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.events.findOne(id);
  }

  @Post()
  @Roles('owner')
  async create(@Body() dto: CreateEventDto, @CurrentUser() user: AuthenticatedUser) {
    return this.events.create(dto, user.id, user.orgId);
  }

  @Put(':id')
  @Roles('owner')
  async update(@Param('id') id: string, @Body() dto: UpdateEventDto, @CurrentUser() user: AuthenticatedUser) {
    return this.events.update(id, dto, user.orgId);
  }

  @Delete(':id')
  @Roles('owner')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    await this.events.remove(id, user.orgId);
  }
}
