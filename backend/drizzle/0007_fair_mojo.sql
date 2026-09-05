ALTER TABLE "auto_mod_config" ALTER COLUMN "filters" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "auto_mod_config" ALTER COLUMN "filters" SET DATA TYPE jsonb USING "filters"::jsonb;--> statement-breakpoint
ALTER TABLE "auto_mod_config" ALTER COLUMN "filters" SET DEFAULT '{}'::jsonb;--> statement-breakpoint
ALTER TABLE "auto_mod_config" ALTER COLUMN "ignored_roles" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "auto_mod_config" ALTER COLUMN "ignored_roles" SET DATA TYPE jsonb USING "ignored_roles"::jsonb;--> statement-breakpoint
ALTER TABLE "auto_mod_config" ALTER COLUMN "ignored_roles" SET DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "auto_mod_config" ALTER COLUMN "ignored_channels" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "auto_mod_config" ALTER COLUMN "ignored_channels" SET DATA TYPE jsonb USING "ignored_channels"::jsonb;--> statement-breakpoint
ALTER TABLE "auto_mod_config" ALTER COLUMN "ignored_channels" SET DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "auto_mod_config" ALTER COLUMN "punishments" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "auto_mod_config" ALTER COLUMN "punishments" SET DATA TYPE jsonb USING "punishments"::jsonb;--> statement-breakpoint
ALTER TABLE "auto_mod_config" ALTER COLUMN "punishments" SET DEFAULT '[]'::jsonb;