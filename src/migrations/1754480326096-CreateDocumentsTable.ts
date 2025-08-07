import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateDocumentsTable1754480326096 implements MigrationInterface {
    name = 'CreateDocumentsTable1754480326096'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."documents_status_enum" AS ENUM('uploaded', 'processing', 'processed', 'failed')`);
        await queryRunner.query(`CREATE TYPE "public"."documents_category_enum" AS ENUM('invoice', 'contract', 'report', 'receipt', 'form', 'other')`);
        await queryRunner.query(`CREATE TABLE "documents" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "filename" character varying NOT NULL, "originalName" character varying NOT NULL, "mimeType" character varying NOT NULL, "size" bigint NOT NULL, "storageKey" character varying NOT NULL, "status" "public"."documents_status_enum" NOT NULL DEFAULT 'uploaded', "extractedText" text, "summary" text, "keywords" text, "category" "public"."documents_category_enum", "confidence" double precision, "language" character varying, "sentiment" double precision, "metadata" jsonb, "extractedFields" jsonb, "embeddings" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_ac51aa5181ee2036f5ca482857c" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "documents"`);
        await queryRunner.query(`DROP TYPE "public"."documents_category_enum"`);
        await queryRunner.query(`DROP TYPE "public"."documents_status_enum"`);
    }

}
