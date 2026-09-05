ALTER TABLE "ticket_events" ALTER COLUMN "payload" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "ticket_events" ALTER COLUMN "payload" SET DATA TYPE jsonb USING "payload"::jsonb;--> statement-breakpoint
ALTER TABLE "ticket_events" ALTER COLUMN "payload" SET DEFAULT '{}'::jsonb;--> statement-breakpoint
ALTER TABLE "ticket_panels" ALTER COLUMN "buttons" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "ticket_panels" ALTER COLUMN "buttons" SET DATA TYPE jsonb USING "buttons"::jsonb;--> statement-breakpoint
ALTER TABLE "ticket_panels" ALTER COLUMN "buttons" SET DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "ticket_settings" ALTER COLUMN "staff_role_ids" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "ticket_settings" ALTER COLUMN "staff_role_ids" SET DATA TYPE jsonb USING "staff_role_ids"::jsonb;--> statement-breakpoint
ALTER TABLE "ticket_settings" ALTER COLUMN "staff_role_ids" SET DEFAULT '[]'::jsonb;