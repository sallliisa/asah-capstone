CREATE TABLE "issue_reports" (
	"id" text PRIMARY KEY,
	"reporter_id" text NOT NULL,
	"room_id" text NOT NULL,
	"title" varchar(160) NOT NULL,
	"description" varchar(2000) NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"activity_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "issue_reports_status" CHECK ("status" in ('open', 'in_progress', 'resolved'))
);
--> statement-breakpoint
CREATE INDEX "issue_reports_reporter_created_idx" ON "issue_reports" ("reporter_id","created_at");--> statement-breakpoint
CREATE INDEX "issue_reports_created_idx" ON "issue_reports" ("created_at");--> statement-breakpoint
ALTER TABLE "issue_reports" ADD CONSTRAINT "issue_reports_reporter_id_users_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "users"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "issue_reports" ADD CONSTRAINT "issue_reports_room_id_rooms_id_fkey" FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "issue_reports" ADD CONSTRAINT "issue_reports_activity_id_activities_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "activities"("id") ON DELETE SET NULL;
