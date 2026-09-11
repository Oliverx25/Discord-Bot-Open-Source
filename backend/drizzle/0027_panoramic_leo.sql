ALTER TABLE "guild_settings" ADD COLUMN "bot_timezone" text DEFAULT 'UTC' NOT NULL;--> statement-breakpoint
ALTER TABLE "guild_settings" ADD COLUMN "bot_locale" text DEFAULT 'en' NOT NULL;