ALTER TABLE "scheduled_messages" ALTER COLUMN "frequency" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "scheduled_messages" ALTER COLUMN "frequency" SET DATA TYPE jsonb USING "frequency"::jsonb;--> statement-breakpoint
ALTER TABLE "scheduled_messages" ALTER COLUMN "frequency" SET DEFAULT '{}'::jsonb;--> statement-breakpoint
ALTER TABLE "scheduled_messages" ALTER COLUMN "embed_data" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "scheduled_messages" ALTER COLUMN "embed_data" SET DATA TYPE jsonb USING "embed_data"::jsonb;--> statement-breakpoint
ALTER TABLE "scheduled_messages" ALTER COLUMN "embed_data" SET DEFAULT '{}'::jsonb;