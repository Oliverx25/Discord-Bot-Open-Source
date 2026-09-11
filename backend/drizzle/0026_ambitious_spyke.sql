ALTER TABLE "oauth_states" ADD COLUMN "flow" text DEFAULT 'login' NOT NULL;--> statement-breakpoint
ALTER TABLE "oauth_states" ADD COLUMN "session_id_hash" text;--> statement-breakpoint
ALTER TABLE "oauth_states" ADD COLUMN "requested_guild_id" text;