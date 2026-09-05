ALTER TABLE "auto_replies" ALTER COLUMN "allowed_channel_ids" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "auto_replies" ALTER COLUMN "allowed_channel_ids" SET DATA TYPE jsonb USING "allowed_channel_ids"::jsonb;--> statement-breakpoint
ALTER TABLE "auto_replies" ALTER COLUMN "allowed_channel_ids" SET DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "auto_replies" ALTER COLUMN "ignored_channel_ids" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "auto_replies" ALTER COLUMN "ignored_channel_ids" SET DATA TYPE jsonb USING "ignored_channel_ids"::jsonb;--> statement-breakpoint
ALTER TABLE "auto_replies" ALTER COLUMN "ignored_channel_ids" SET DEFAULT '[]'::jsonb;