CREATE TABLE "pi_routing_events" (
	"id" text PRIMARY KEY,
	"owner_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"question" text NOT NULL,
	"result" jsonb NOT NULL
);
--> statement-breakpoint
ALTER TABLE "pi_routing_events" ADD CONSTRAINT "pi_routing_events_owner_id_users_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE RESTRICT;