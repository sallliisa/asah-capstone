DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "activities" WHERE "scheduled_date" IS NOT NULL AND "scheduled_date" IS DISTINCT FROM "occurrence_date") THEN
    RAISE EXCEPTION 'Activity scheduled dates differ from occurrence dates. Reconcile these records before this migration.';
  END IF;
END $$;
--> statement-breakpoint
ALTER TABLE "activities" DROP COLUMN "scheduled_date";