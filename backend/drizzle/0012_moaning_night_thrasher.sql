ALTER TABLE "auto_roles" ALTER COLUMN "human_roles" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "auto_roles" ALTER COLUMN "human_roles" SET DATA TYPE jsonb USING "human_roles"::jsonb;--> statement-breakpoint
ALTER TABLE "auto_roles" ALTER COLUMN "human_roles" SET DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "auto_roles" ALTER COLUMN "bot_roles" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "auto_roles" ALTER COLUMN "bot_roles" SET DATA TYPE jsonb USING "bot_roles"::jsonb;--> statement-breakpoint
ALTER TABLE "auto_roles" ALTER COLUMN "bot_roles" SET DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "autoroles_registry" ALTER COLUMN "roles_mapping" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "autoroles_registry" ALTER COLUMN "roles_mapping" SET DATA TYPE jsonb USING "roles_mapping"::jsonb;--> statement-breakpoint
ALTER TABLE "autoroles_registry" ALTER COLUMN "roles_mapping" SET DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "reaction_roles_menus" ALTER COLUMN "roles_mapping" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "reaction_roles_menus" ALTER COLUMN "roles_mapping" SET DATA TYPE jsonb USING "roles_mapping"::jsonb;--> statement-breakpoint
ALTER TABLE "reaction_roles_menus" ALTER COLUMN "roles_mapping" SET DEFAULT '[]'::jsonb;