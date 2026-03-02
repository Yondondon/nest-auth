import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUsersTable1772443652659 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id"         INTEGER GENERATED ALWAYS AS IDENTITY NOT NULL,
        "uuid"       UUID         NOT NULL UNIQUE DEFAULT uuid_generate_v4(),
        "username"   VARCHAR      NOT NULL UNIQUE,
        "password"   VARCHAR      NOT NULL,
        "createdAt" TIMESTAMPTZ  NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ  NOT NULL DEFAULT now(),
        CONSTRAINT "PK_users" PRIMARY KEY ("id")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "users"`);
  }
}
