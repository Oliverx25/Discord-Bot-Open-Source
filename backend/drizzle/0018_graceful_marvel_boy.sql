ALTER TABLE "mod_logs" ALTER COLUMN "meta" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "mod_logs" ALTER COLUMN "meta" SET DATA TYPE jsonb USING "meta"::jsonb;