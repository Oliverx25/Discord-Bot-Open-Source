ALTER TABLE "form_responses" ALTER COLUMN "answers" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "form_responses" ALTER COLUMN "answers" SET DATA TYPE jsonb USING "answers"::jsonb;--> statement-breakpoint
ALTER TABLE "form_responses" ALTER COLUMN "answers" SET DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "guild_forms" ALTER COLUMN "questions" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "guild_forms" ALTER COLUMN "questions" SET DATA TYPE jsonb USING "questions"::jsonb;--> statement-breakpoint
ALTER TABLE "guild_forms" ALTER COLUMN "questions" SET DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "guild_forms" ALTER COLUMN "required_role_ids" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "guild_forms" ALTER COLUMN "required_role_ids" SET DATA TYPE jsonb USING "required_role_ids"::jsonb;--> statement-breakpoint
ALTER TABLE "guild_forms" ALTER COLUMN "required_role_ids" SET DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "guild_forms" ALTER COLUMN "blocked_role_ids" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "guild_forms" ALTER COLUMN "blocked_role_ids" SET DATA TYPE jsonb USING "blocked_role_ids"::jsonb;--> statement-breakpoint
ALTER TABLE "guild_forms" ALTER COLUMN "blocked_role_ids" SET DEFAULT '[]'::jsonb;