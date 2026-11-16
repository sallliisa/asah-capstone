CREATE TABLE "activity_tenant_attribution_changes" (
	"id" text PRIMARY KEY,
	"activity_id" text NOT NULL,
	"previous_tenant_id" text,
	"new_tenant_id" text,
	"changed_by" text NOT NULL,
	"changed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"reason" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "activities" ADD COLUMN "tenant_id" text;--> statement-breakpoint
ALTER TABLE "recurring_plans" ADD COLUMN "tenant_id" text;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_tenant_id_users_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "users"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "activity_tenant_attribution_changes" ADD CONSTRAINT "activity_tenant_attribution_changes_nSKm7O0qhQyI_fkey" FOREIGN KEY ("activity_id") REFERENCES "activities"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "activity_tenant_attribution_changes" ADD CONSTRAINT "activity_tenant_attribution_changes_hIUO5iMDF9kS_fkey" FOREIGN KEY ("previous_tenant_id") REFERENCES "users"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "activity_tenant_attribution_changes" ADD CONSTRAINT "activity_tenant_attribution_changes_new_tenant_id_users_id_fkey" FOREIGN KEY ("new_tenant_id") REFERENCES "users"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "activity_tenant_attribution_changes" ADD CONSTRAINT "activity_tenant_attribution_changes_changed_by_users_id_fkey" FOREIGN KEY ("changed_by") REFERENCES "users"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "recurring_plans" ADD CONSTRAINT "recurring_plans_tenant_id_users_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "users"("id") ON DELETE RESTRICT;