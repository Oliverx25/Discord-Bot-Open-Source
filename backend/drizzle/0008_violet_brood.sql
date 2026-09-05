ALTER TABLE "action_logs" ALTER COLUMN "details" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "action_logs" ALTER COLUMN "details" SET DATA TYPE jsonb USING "details"::jsonb;--> statement-breakpoint
ALTER TABLE "action_logs" ALTER COLUMN "details" SET DEFAULT '{}'::jsonb;--> statement-breakpoint
ALTER TABLE "action_logs_config" ALTER COLUMN "channels_mapping" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "action_logs_config" ALTER COLUMN "channels_mapping" SET DATA TYPE jsonb USING "channels_mapping"::jsonb;--> statement-breakpoint
ALTER TABLE "action_logs_config" ALTER COLUMN "channels_mapping" SET DEFAULT '{}'::jsonb;--> statement-breakpoint
ALTER TABLE "action_logs_config" ALTER COLUMN "ignored_channels" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "action_logs_config" ALTER COLUMN "ignored_channels" SET DATA TYPE jsonb USING "ignored_channels"::jsonb;--> statement-breakpoint
ALTER TABLE "action_logs_config" ALTER COLUMN "ignored_channels" SET DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "action_logs_config" ALTER COLUMN "ignored_roles" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "action_logs_config" ALTER COLUMN "ignored_roles" SET DATA TYPE jsonb USING "ignored_roles"::jsonb;--> statement-breakpoint
ALTER TABLE "action_logs_config" ALTER COLUMN "ignored_roles" SET DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "action_logs_config" ALTER COLUMN "enabled_events" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "action_logs_config" ALTER COLUMN "enabled_events" SET DATA TYPE jsonb USING "enabled_events"::jsonb;--> statement-breakpoint
ALTER TABLE "action_logs_config" ALTER COLUMN "enabled_events" SET DEFAULT '{}'::jsonb;--> statement-breakpoint
ALTER TABLE "action_logs_config" ALTER COLUMN "webhooks_mapping" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "action_logs_config" ALTER COLUMN "webhooks_mapping" SET DATA TYPE jsonb USING "webhooks_mapping"::jsonb;--> statement-breakpoint
ALTER TABLE "action_logs_config" ALTER COLUMN "webhooks_mapping" SET DEFAULT '{}'::jsonb;