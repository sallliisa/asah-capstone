CREATE TABLE "activity_categories" (
	"id" text PRIMARY KEY,
	"name" varchar(100) NOT NULL UNIQUE,
	"created_by_user_id" text,
	"updated_by_user_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
INSERT INTO "activity_categories" ("id", "name") VALUES ('activity-category-general', 'General');
--> statement-breakpoint
INSERT INTO "activity_categories" ("id", "name")
SELECT 'activity-category-' || md5("name"), "name"
FROM (
  SELECT DISTINCT btrim("category") AS "name" FROM "activities"
  UNION
  SELECT DISTINCT btrim("category") AS "name" FROM "recurring_plans"
) AS "legacy_categories"
WHERE "name" IS NOT NULL AND "name" <> '' AND "name" <> 'General';
--> statement-breakpoint
ALTER TABLE "activities" ADD COLUMN "category_id" text DEFAULT 'activity-category-general' NOT NULL;--> statement-breakpoint
ALTER TABLE "recurring_plans" ADD COLUMN "category_id" text DEFAULT 'activity-category-general' NOT NULL;--> statement-breakpoint
UPDATE "activities" AS a SET "category_id" = c."id" FROM "activity_categories" AS c WHERE c."name" = btrim(a."category");
--> statement-breakpoint
UPDATE "recurring_plans" AS p SET "category_id" = c."id" FROM "activity_categories" AS c WHERE c."name" = btrim(p."category");
--> statement-breakpoint
ALTER TABLE "activities" DROP CONSTRAINT "activities_finance";
--> statement-breakpoint
ALTER TABLE "recurring_plans" DROP CONSTRAINT "recurring_plans_finance";
--> statement-breakpoint
ALTER TABLE "activities" DROP COLUMN "category";
--> statement-breakpoint
ALTER TABLE "recurring_plans" DROP COLUMN "category";
--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_category_id_activity_categories_id_fkey" FOREIGN KEY ("category_id") REFERENCES "activity_categories"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "activity_categories" ADD CONSTRAINT "activity_categories_created_by_user_id_users_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "activity_categories" ADD CONSTRAINT "activity_categories_updated_by_user_id_users_id_fkey" FOREIGN KEY ("updated_by_user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "recurring_plans" ADD CONSTRAINT "recurring_plans_category_id_activity_categories_id_fkey" FOREIGN KEY ("category_id") REFERENCES "activity_categories"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_finance" CHECK (("financial_kind" = 'none' and "amount" is null and "payment_status" is null and "payment_date" is null and "receipt" is null) or ("financial_kind" in ('income','expense') and "payment_status" is not null and ("amount" is null or "amount" > 0) and (("payment_status" = 'draft' and "payment_date" is null) or ("payment_status" = 'settled' and "amount" is not null and "payment_date" is not null))));--> statement-breakpoint
ALTER TABLE "recurring_plans" ADD CONSTRAINT "recurring_plans_finance" CHECK (("financial_kind" = 'none' and "amount" is null) or ("financial_kind" in ('income','expense') and ("amount" is null or "amount" > 0)));