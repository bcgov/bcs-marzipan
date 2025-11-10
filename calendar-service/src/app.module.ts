import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CalendarEntity } from './calendar/entities/calendar.entity'; // use with a real database
import { CalendarModule } from './calendar/calendar.module';
import { TypeOrmModule } from '@nestjs/typeorm'; // use with a real database
import { UserModule } from './user/user.module';
import { UserEntity } from './user/entities/user.entity'; // use with a real database

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: ':memory:',
      entities: [CalendarEntity, UserEntity],
      synchronize: true,
}), CalendarModule, UserModule,
  ], 
  // imports: [CalendarModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
