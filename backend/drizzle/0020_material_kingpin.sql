ALTER TABLE "starboard_settings" ALTER COLUMN "emojis" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "starboard_settings" ALTER COLUMN "emojis" SET DATA TYPE jsonb USING "emojis"::jsonb;--> statement-breakpoint
ALTER TABLE "starboard_settings" ALTER COLUMN "emojis" SET DEFAULT '["unicode:⭐"]'::jsonb;--> statement-breakpoint
ALTER TABLE "starboard_settings" ALTER COLUMN "ignore_channel_ids" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "starboard_settings" ALTER COLUMN "ignore_channel_ids" SET DATA TYPE jsonb USING "ignore_channel_ids"::jsonb;--> statement-breakpoint
ALTER TABLE "starboard_settings" ALTER COLUMN "ignore_channel_ids" SET DEFAULT '[]'::jsonb;