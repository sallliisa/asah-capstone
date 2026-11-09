CREATE TABLE "rooms" (
	"id" text PRIMARY KEY,
	"room_code" varchar(30) NOT NULL UNIQUE,
	"name" varchar(100) NOT NULL,
	"description" varchar(1000),
	"created_by_user_id" text,
	"updated_by_user_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_created_by_user_id_users_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_updated_by_user_id_users_id_fkey" FOREIGN KEY ("updated_by_user_id") REFERENCES "users"("id");