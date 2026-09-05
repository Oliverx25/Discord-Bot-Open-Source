ALTER TABLE "auto_delete_config" ALTER COLUMN "rules" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "auto_delete_config" ALTER COLUMN "rules" SET DATA TYPE jsonb USING "rules"::jsonb;--> statement-breakpoint
ALTER TABLE "auto_delete_config" ALTER COLUMN "rules" SET DEFAULT '[]'::jsonb;