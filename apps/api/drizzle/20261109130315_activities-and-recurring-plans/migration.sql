CREATE TABLE "activities" (
	"id" text PRIMARY KEY,
	"name" varchar(160) NOT NULL,
	"description" text,
	"room_id" text,
	"work_status" text DEFAULT 'planned' NOT NULL,
	"scheduled_date" date,
	"completed_date" date,
	"financial_kind" text DEFAULT 'none' NOT NULL,
	"category" varchar(100),
	"amount" integer,
	"payment_status" text,
	"payment_date" date,
	"receipt" text,
	"recurring_plan_id" text,
	"occurrence_date" date,
	"created_by_user_id" text,
	"updated_by_user_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "activities_work_status" CHECK ("work_status" in ('planned','in_progress','completed','cancelled')),
	CONSTRAINT "activities_completion" CHECK (("work_status" = 'completed' and "completed_date" is not null) or ("work_status" <> 'completed' and "completed_date" is null)),
	CONSTRAINT "activities_finance" CHECK (("financial_kind" = 'none' and "category" is null and "amount" is null and "payment_status" is null and "payment_date" is null and "receipt" is null) or ("financial_kind" in ('income','expense') and "payment_status" is not null and "category" is not null and length(trim("category")) > 0 and ("amount" is null or "amount" > 0) and (("payment_status" = 'draft' and "payment_date" is null) or ("payment_status" = 'settled' and "amount" is not null and "payment_date" is not null)))),
	CONSTRAINT "activities_occurrence" CHECK (("recurring_plan_id" is null and "occurrence_date" is null) or ("recurring_plan_id" is not null and "occurrence_date" is not null))
);
--> statement-breakpoint
CREATE TABLE "recurring_plans" (
	"id" text PRIMARY KEY,
	"name" varchar(160) NOT NULL,
	"description" text,
	"room_id" text,
	"start_date" date NOT NULL,
	"interval_count" integer DEFAULT 1 NOT NULL,
	"interval_unit" text DEFAULT 'week' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"financial_kind" text DEFAULT 'none' NOT NULL,
	"category" varchar(100),
	"amount" integer,
	"occurrence_index" integer DEFAULT 0 NOT NULL,
	"next_occurrence_date" date NOT NULL,
	"created_by_user_id" text,
	"updated_by_user_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "recurring_plans_interval" CHECK ("interval_count" between 1 and 366 and "interval_unit" in ('day', 'week', 'month')),
	CONSTRAINT "recurring_plans_finance" CHECK (("financial_kind" = 'none' and "category" is null and "amount" is null) or ("financial_kind" in ('income','expense') and "category" is not null and length(trim("category")) > 0 and ("amount" is null or "amount" > 0)))
);
--> statement-breakpoint
CREATE UNIQUE INDEX "activities_plan_occurrence_unique" ON "activities" ("recurring_plan_id","occurrence_date");--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_room_id_rooms_id_fkey" FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_recurring_plan_id_recurring_plans_id_fkey" FOREIGN KEY ("recurring_plan_id") REFERENCES "recurring_plans"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_created_by_user_id_users_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_updated_by_user_id_users_id_fkey" FOREIGN KEY ("updated_by_user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "recurring_plans" ADD CONSTRAINT "recurring_plans_room_id_rooms_id_fkey" FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "recurring_plans" ADD CONSTRAINT "recurring_plans_created_by_user_id_users_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "recurring_plans" ADD CONSTRAINT "recurring_plans_updated_by_user_id_users_id_fkey" FOREIGN KEY ("updated_by_user_id") REFERENCES "users"("id");