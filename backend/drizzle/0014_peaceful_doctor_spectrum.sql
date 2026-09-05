ALTER TABLE "custom_commands" ALTER COLUMN "response_data" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "custom_commands" ALTER COLUMN "response_data" SET DATA TYPE jsonb USING "response_data"::jsonb;--> statement-breakpoint
ALTER TABLE "custom_commands" ALTER COLUMN "response_data" SET DEFAULT '{}'::jsonb;--> statement-breakpoint
ALTER TABLE "custom_commands" ALTER COLUMN "options" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "custom_commands" ALTER COLUMN "options" SET DATA TYPE jsonb USING "options"::jsonb;--> statement-breakpoint
ALTER TABLE "custom_commands" ALTER COLUMN "options" SET DEFAULT '{}'::jsonb;--> statement-breakpoint
ALTER TABLE "custom_commands" ALTER COLUMN "permissions" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "custom_commands" ALTER COLUMN "permissions" SET DATA TYPE jsonb USING "permissions"::jsonb;--> statement-breakpoint
ALTER TABLE "custom_commands" ALTER COLUMN "permissions" SET DEFAULT '{}'::jsonb;--> statement-breakpoint
ALTER TABLE "default_command_permissions" ALTER COLUMN "allowed_roles" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "default_command_permissions" ALTER COLUMN "allowed_roles" SET DATA TYPE jsonb USING "allowed_roles"::jsonb;--> statement-breakpoint
ALTER TABLE "default_command_permissions" ALTER COLUMN "allowed_roles" SET DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "default_command_permissions" ALTER COLUMN "ignored_channels" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "default_command_permissions" ALTER COLUMN "ignored_channels" SET DATA TYPE jsonb USING "ignored_channels"::jsonb;--> statement-breakpoint
ALTER TABLE "default_command_permissions" ALTER COLUMN "ignored_channels" SET DEFAULT '[]'::jsonb;