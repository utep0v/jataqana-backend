import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Application } from './entity/application.entity';
import { ApplicationService } from './application.service';
import { ApplicationController } from './application.controller';
import { ApplicationAccess } from './entity/application-access.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Application, ApplicationAccess])],
  providers: [ApplicationService],
  controllers: [ApplicationController],
})
export class ApplicationModule {}
