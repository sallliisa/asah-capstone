CREATE TABLE "room_types" (
	"id" text PRIMARY KEY,
	"name" varchar(100) NOT NULL,
	"cost" integer NOT NULL,
	"created_by_user_id" text,
	"updated_by_user_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "room_types_cost_nonnegative" CHECK ("cost" >= 0)
);
--> statement-breakpoint
INSERT INTO "room_types" ("id", "name", "cost") VALUES ('room-type-standard', 'Standard', 1500000) ON CONFLICT ("id") DO NOTHING;
--> statement-breakpoint
INSERT INTO "roles" ("id", "role_code", "name", "active") VALUES ('role-occupant', 'occupant', 'Occupant', true) ON CONFLICT ("role_code") DO NOTHING;
--> statement-breakpoint
ALTER TABLE "rooms" ADD COLUMN "occupant_id" text;--> statement-breakpoint
ALTER TABLE "rooms" ADD COLUMN "room_type_id" text DEFAULT 'room-type-standard' NOT NULL;--> statement-breakpoint
ALTER TABLE "room_types" ADD CONSTRAINT "room_types_created_by_user_id_users_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "room_types" ADD CONSTRAINT "room_types_updated_by_user_id_users_id_fkey" FOREIGN KEY ("updated_by_user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_occupant_id_users_id_fkey" FOREIGN KEY ("occupant_id") REFERENCES "users"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_room_type_id_room_types_id_fkey" FOREIGN KEY ("room_type_id") REFERENCES "room_types"("id") ON DELETE RESTRICT;