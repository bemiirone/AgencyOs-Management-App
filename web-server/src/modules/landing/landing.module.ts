import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LandingService } from './landing.service';
import { LandingController, AdminLandingController } from './landing.controller';
import { LandingSection, LandingSectionSchema } from './schemas/landing-section.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: LandingSection.name, schema: LandingSectionSchema }])],
  controllers: [LandingController, AdminLandingController],
  providers: [LandingService],
  exports: [LandingService],
})
export class LandingModule {}
