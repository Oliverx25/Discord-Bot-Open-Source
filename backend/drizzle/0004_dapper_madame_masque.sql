CREATE TABLE "worker_leases" (
	"name" text PRIMARY KEY NOT NULL,
	"holder" text NOT NULL,
	"fencing_token" integer DEFAULT 0 NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
