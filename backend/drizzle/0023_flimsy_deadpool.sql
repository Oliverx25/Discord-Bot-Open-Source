ALTER TABLE "giveaway_settings" ALTER COLUMN "manager_role_ids" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "giveaway_settings" ALTER COLUMN "manager_role_ids" SET DATA TYPE jsonb USING "manager_role_ids"::jsonb;--> statement-breakpoint
ALTER TABLE "giveaway_settings" ALTER COLUMN "manager_role_ids" SET DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "giveaways" ALTER COLUMN "required_role_ids" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "giveaways" ALTER COLUMN "required_role_ids" SET DATA TYPE jsonb USING "required_role_ids"::jsonb;--> statement-breakpoint
ALTER TABLE "giveaways" ALTER COLUMN "required_role_ids" SET DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "giveaways" ALTER COLUMN "blocked_role_ids" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "giveaways" ALTER COLUMN "blocked_role_ids" SET DATA TYPE jsonb USING "blocked_role_ids"::jsonb;--> statement-breakpoint
ALTER TABLE "giveaways" ALTER COLUMN "blocked_role_ids" SET DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "giveaways" ALTER COLUMN "winner_ids" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "giveaways" ALTER COLUMN "winner_ids" SET DATA TYPE jsonb USING "winner_ids"::jsonb;--> statement-breakpoint
ALTER TABLE "giveaways" ALTER COLUMN "winner_ids" SET DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "giveaways" ALTER COLUMN "past_winner_ids" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "giveaways" ALTER COLUMN "past_winner_ids" SET DATA TYPE jsonb USING "past_winner_ids"::jsonb;--> statement-breakpoint
ALTER TABLE "giveaways" ALTER COLUMN "past_winner_ids" SET DEFAULT '[]'::jsonb;