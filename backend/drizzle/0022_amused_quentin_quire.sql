ALTER TABLE "economy_casino" ALTER COLUMN "coinflip" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "economy_casino" ALTER COLUMN "coinflip" SET DATA TYPE jsonb USING "coinflip"::jsonb;--> statement-breakpoint
ALTER TABLE "economy_casino" ALTER COLUMN "coinflip" SET DEFAULT '{}'::jsonb;--> statement-breakpoint
ALTER TABLE "economy_casino" ALTER COLUMN "roulette" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "economy_casino" ALTER COLUMN "roulette" SET DATA TYPE jsonb USING "roulette"::jsonb;--> statement-breakpoint
ALTER TABLE "economy_casino" ALTER COLUMN "roulette" SET DEFAULT '{}'::jsonb;--> statement-breakpoint
ALTER TABLE "economy_casino" ALTER COLUMN "blackjack" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "economy_casino" ALTER COLUMN "blackjack" SET DATA TYPE jsonb USING "blackjack"::jsonb;--> statement-breakpoint
ALTER TABLE "economy_casino" ALTER COLUMN "blackjack" SET DEFAULT '{}'::jsonb;--> statement-breakpoint
ALTER TABLE "economy_casino" ALTER COLUMN "slots" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "economy_casino" ALTER COLUMN "slots" SET DATA TYPE jsonb USING "slots"::jsonb;--> statement-breakpoint
ALTER TABLE "economy_casino" ALTER COLUMN "slots" SET DEFAULT '{}'::jsonb;--> statement-breakpoint
ALTER TABLE "economy_income" ALTER COLUMN "role_salaries" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "economy_income" ALTER COLUMN "role_salaries" SET DATA TYPE jsonb USING "role_salaries"::jsonb;--> statement-breakpoint
ALTER TABLE "economy_income" ALTER COLUMN "role_salaries" SET DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "economy_income" ALTER COLUMN "jobs" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "economy_income" ALTER COLUMN "jobs" SET DATA TYPE jsonb USING "jobs"::jsonb;--> statement-breakpoint
ALTER TABLE "economy_income" ALTER COLUMN "jobs" SET DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "economy_income" ALTER COLUMN "crimes" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "economy_income" ALTER COLUMN "crimes" SET DATA TYPE jsonb USING "crimes"::jsonb;--> statement-breakpoint
ALTER TABLE "economy_income" ALTER COLUMN "crimes" SET DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "economy_income" ALTER COLUMN "rob" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "economy_income" ALTER COLUMN "rob" SET DATA TYPE jsonb USING "rob"::jsonb;--> statement-breakpoint
ALTER TABLE "economy_income" ALTER COLUMN "rob" SET DEFAULT '{}'::jsonb;--> statement-breakpoint
ALTER TABLE "economy_purchases" ALTER COLUMN "metadata" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "economy_purchases" ALTER COLUMN "metadata" SET DATA TYPE jsonb USING "metadata"::jsonb;--> statement-breakpoint
ALTER TABLE "economy_purchases" ALTER COLUMN "metadata" SET DEFAULT '{}'::jsonb;--> statement-breakpoint
ALTER TABLE "economy_shop_items" ALTER COLUMN "rewards" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "economy_shop_items" ALTER COLUMN "rewards" SET DATA TYPE jsonb USING "rewards"::jsonb;--> statement-breakpoint
ALTER TABLE "economy_shop_items" ALTER COLUMN "rewards" SET DEFAULT '{}'::jsonb;--> statement-breakpoint
ALTER TABLE "economy_shop_items" ALTER COLUMN "action_sequence" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "economy_shop_items" ALTER COLUMN "action_sequence" SET DATA TYPE jsonb USING "action_sequence"::jsonb;--> statement-breakpoint
ALTER TABLE "economy_shop_items" ALTER COLUMN "action_sequence" SET DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "economy_shop_items" ALTER COLUMN "reward_config" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "economy_shop_items" ALTER COLUMN "reward_config" SET DATA TYPE jsonb USING "reward_config"::jsonb;--> statement-breakpoint
ALTER TABLE "economy_shop_items" ALTER COLUMN "reward_config" SET DEFAULT '{}'::jsonb;