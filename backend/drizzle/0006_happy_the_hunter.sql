ALTER TABLE "voice_room_generators" ALTER COLUMN "allowed_actions" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "voice_room_generators" ALTER COLUMN "allowed_actions" SET DATA TYPE jsonb USING "allowed_actions"::jsonb;--> statement-breakpoint
ALTER TABLE "voice_room_generators" ALTER COLUMN "allowed_actions" SET DEFAULT '{}'::jsonb;