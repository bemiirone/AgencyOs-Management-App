import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TimeEntryService } from './time-entry.service';
import { TimeEntryController } from './time-entry.controller';
import { TimeGateway } from './time.gateway';
import { TimeEntry, TimeEntrySchema } from './schemas/time-entry.schema';
import { WsJwtStrategy } from '../auth/strategies/ws-jwt.strategy';

@Module({
  imports: [MongooseModule.forFeature([{ name: TimeEntry.name, schema: TimeEntrySchema }])],
  controllers: [TimeEntryController],
  providers: [TimeEntryService, TimeGateway, WsJwtStrategy],
  exports: [TimeEntryService],
})
export class TimeModule {}
