DROP INDEX "idx_guild_entitlements_subscription";--> statement-breakpoint
ALTER TABLE "guild_entitlements" ADD CONSTRAINT "guild_entitlements_subscription_id_unique" UNIQUE("subscription_id");