ALTER TABLE "embed_templates" ALTER COLUMN "embed_data" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "embed_templates" ALTER COLUMN "embed_data" SET DATA TYPE jsonb USING "embed_data"::jsonb;--> statement-breakpoint
ALTER TABLE "sent_embeds" ALTER COLUMN "embed_data" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "sent_embeds" ALTER COLUMN "embed_data" SET DATA TYPE jsonb USING "embed_data"::jsonb;