ALTER TABLE "canvas_event_settings" ALTER COLUMN "text_layers" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "canvas_event_settings" ALTER COLUMN "text_layers" SET DATA TYPE jsonb USING "text_layers"::jsonb;--> statement-breakpoint
ALTER TABLE "welcome_settings" ALTER COLUMN "text_layers" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "welcome_settings" ALTER COLUMN "text_layers" SET DATA TYPE jsonb USING "text_layers"::jsonb;