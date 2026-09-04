import {
  Controller, Post, Body, Param, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { RentalsService } from './services/rentals.service';
import { CheckoutDto } from './dto/checkout.dto';
import { CheckinDto } from './dto/checkin.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';

@Controller('events/:eventId')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RentalsController {
  constructor(private rentals: RentalsService) {}

  @Post('checkout')
  @HttpCode(HttpStatus.OK)
  async checkout(
    @Param('eventId') eventId: string,
    @Body() dto: CheckoutDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.rentals.checkout(eventId, dto, user.id, user.orgId);
  }

  @Post('checkin')
  @HttpCode(HttpStatus.OK)
  async checkin(
    @Param('eventId') eventId: string,
    @Body() dto: CheckinDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.rentals.checkin(eventId, dto, user.orgId);
  }

  @Post('rental-items/:itemId/undo-checkout')
  @Roles('owner')
  @HttpCode(HttpStatus.OK)
  async undoCheckout(
    @Param('eventId') eventId: string,
    @Param('itemId') itemId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.rentals.undoCheckout(eventId, itemId, user.orgId);
  }

  @Post('close')
  @HttpCode(HttpStatus.OK)
  async close(
    @Param('eventId') eventId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.rentals.close(eventId, user.orgId);
  }
}
