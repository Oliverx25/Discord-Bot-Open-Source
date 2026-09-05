ALTER TABLE "anti_raid_settings" ALTER COLUMN "whitelist_role_ids" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "anti_raid_settings" ALTER COLUMN "whitelist_role_ids" SET DATA TYPE jsonb USING "whitelist_role_ids"::jsonb;--> statement-breakpoint
ALTER TABLE "anti_raid_settings" ALTER COLUMN "whitelist_role_ids" SET DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "anti_raid_settings" ALTER COLUMN "nuke_thresholds" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "anti_raid_settings" ALTER COLUMN "nuke_thresholds" SET DATA TYPE jsonb USING "nuke_thresholds"::jsonb;--> statement-breakpoint
ALTER TABLE "anti_raid_settings" ALTER COLUMN "nuke_thresholds" SET DEFAULT '{}'::jsonb;--> statement-breakpoint
ALTER TABLE "anti_raid_settings" ALTER COLUMN "nuke_whitelist_user_ids" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "anti_raid_settings" ALTER COLUMN "nuke_whitelist_user_ids" SET DATA TYPE jsonb USING "nuke_whitelist_user_ids"::jsonb;--> statement-breakpoint
ALTER TABLE "anti_raid_settings" ALTER COLUMN "nuke_whitelist_user_ids" SET DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "anti_raid_settings" ALTER COLUMN "nuke_whitelist_role_ids" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "anti_raid_settings" ALTER COLUMN "nuke_whitelist_role_ids" SET DATA TYPE jsonb USING "nuke_whitelist_role_ids"::jsonb;--> statement-breakpoint
ALTER TABLE "anti_raid_settings" ALTER COLUMN "nuke_whitelist_role_ids" SET DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "anti_raid_settings" ALTER COLUMN "lockdown_snapshot" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "anti_raid_settings" ALTER COLUMN "lockdown_snapshot" SET DATA TYPE jsonb USING "lockdown_snapshot"::jsonb;--> statement-breakpoint
ALTER TABLE "anti_raid_settings" ALTER COLUMN "lockdown_snapshot" SET DEFAULT '[]'::jsonb;