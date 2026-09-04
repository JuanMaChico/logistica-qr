import { Module } from '@nestjs/common';
import { PrismaModule } from './modules/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { EquipmentModule } from './modules/equipment/equipment.module';
import { EventsModule } from './modules/events/events.module';
import { RentalsModule } from './modules/rentals/rentals.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { EmployeesModule } from './modules/employees/employees.module';

@Module({
  imports: [PrismaModule, AuthModule, EquipmentModule, EventsModule, RentalsModule, DashboardModule, EmployeesModule],
})
export class AppModule {}
