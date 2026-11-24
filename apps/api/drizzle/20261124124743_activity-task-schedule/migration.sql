ALTER TABLE "activities" ADD COLUMN "due_date" date;--> statement-breakpoint
ALTER TABLE "activities" ADD COLUMN "task_target" text;--> statement-breakpoint
ALTER TABLE "recurring_plans" ADD COLUMN "lead_days" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "recurring_plans" ADD COLUMN "task_target" text;--> statement-breakpoint
UPDATE "activities"
SET "due_date" = "occurrence_date",
    "task_target" = CASE
      WHEN "financial_kind" = 'none' OR "category_id" IN (
        'activity-category-corrective-repairs', 'activity-category-scheduled-servicing',
        'activity-category-routine-cleaning', 'activity-category-extra-cleaning'
      ) THEN 'work'
      ELSE 'payment'
    END
WHERE "recurring_plan_id" IS NOT NULL;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_schedule" CHECK (("due_date" is null and "task_target" is null) or ("due_date" is not null and "task_target" is not null and ("task_target" = 'work' or ("task_target" = 'payment' and "financial_kind" <> 'none'))));--> statement-breakpoint
ALTER TABLE "recurring_plans" ADD CONSTRAINT "recurring_plans_opening" CHECK ("lead_days" between 0 and 366 and ("task_target" is null or "task_target" = 'work' or ("task_target" = 'payment' and "financial_kind" <> 'none')));
