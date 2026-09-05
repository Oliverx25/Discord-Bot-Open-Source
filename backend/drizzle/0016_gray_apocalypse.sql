ALTER TABLE "xp_config" ALTER COLUMN "ignored_roles" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "xp_config" ALTER COLUMN "ignored_roles" SET DATA TYPE jsonb USING "ignored_roles"::jsonb;--> statement-breakpoint
ALTER TABLE "xp_config" ALTER COLUMN "ignored_roles" SET DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "xp_config" ALTER COLUMN "ignored_channels" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "xp_config" ALTER COLUMN "ignored_channels" SET DATA TYPE jsonb USING "ignored_channels"::jsonb;--> statement-breakpoint
ALTER TABLE "xp_config" ALTER COLUMN "ignored_channels" SET DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "xp_config" ALTER COLUMN "custom_multipliers" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "xp_config" ALTER COLUMN "custom_multipliers" SET DATA TYPE jsonb USING "custom_multipliers"::jsonb;--> statement-breakpoint
ALTER TABLE "xp_config" ALTER COLUMN "custom_multipliers" SET DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "xp_config" ALTER COLUMN "custom_channel_multipliers" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "xp_config" ALTER COLUMN "custom_channel_multipliers" SET DATA TYPE jsonb USING "custom_channel_multipliers"::jsonb;--> statement-breakpoint
ALTER TABLE "xp_config" ALTER COLUMN "custom_channel_multipliers" SET DEFAULT '[]'::jsonb;