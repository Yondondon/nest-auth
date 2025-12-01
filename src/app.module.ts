import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        type: 'postgres',
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT),
        username: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        entities: ['entities/**/*.entity{.ts,.ts}'],
        migrations: ['database/migrations/*.ts'],
        migrationsTableName: 'migrations',
        migrationsRun: true,
        synchronize: false,
        logging: true,
      }),
    }),
    UsersModule,
  ],
})
export class AppModule {}
