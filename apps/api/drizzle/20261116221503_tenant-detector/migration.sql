CREATE TABLE "tenant_detector_coverage" (
	"tenant_id" text PRIMARY KEY,
	"repairs_from" date,
	"cleaning_from" date,
	"rent_from" date,
	"repair_costs_complete" boolean DEFAULT false NOT NULL,
	"confirmed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"confirmed_by" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tenant_detector_prediction_rooms" (
	"prediction_id" text NOT NULL,
	"room_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tenant_detector_predictions" (
	"id" text PRIMARY KEY,
	"tenant_id" text NOT NULL,
	"as_of_date" date NOT NULL,
	"generated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"source_revision" integer NOT NULL,
	"input_hash" text NOT NULL,
	"model_version" text NOT NULL,
	"feature_version" text NOT NULL,
	"input" jsonb NOT NULL,
	"result" jsonb NOT NULL,
	"grade" text,
	"score" double precision
);
--> statement-breakpoint
CREATE TABLE "tenant_detector_state" (
	"tenant_id" text PRIMARY KEY,
	"source_revision" integer DEFAULT 1 NOT NULL,
	"pending" boolean DEFAULT true NOT NULL,
	"last_attempt" timestamp with time zone,
	"error" text,
	"latest_prediction_id" text,
	"daily_date" date
);
--> statement-breakpoint
CREATE UNIQUE INDEX "tenant_detector_prediction_room" ON "tenant_detector_prediction_rooms" ("prediction_id","room_id");--> statement-breakpoint
CREATE UNIQUE INDEX "tenant_detector_prediction_input" ON "tenant_detector_predictions" ("tenant_id","as_of_date","input_hash","model_version");--> statement-breakpoint
ALTER TABLE "tenant_detector_coverage" ADD CONSTRAINT "tenant_detector_coverage_tenant_id_users_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "users"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "tenant_detector_coverage" ADD CONSTRAINT "tenant_detector_coverage_confirmed_by_users_id_fkey" FOREIGN KEY ("confirmed_by") REFERENCES "users"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "tenant_detector_prediction_rooms" ADD CONSTRAINT "tenant_detector_prediction_rooms_akRoZyqveX8V_fkey" FOREIGN KEY ("prediction_id") REFERENCES "tenant_detector_predictions"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "tenant_detector_prediction_rooms" ADD CONSTRAINT "tenant_detector_prediction_rooms_room_id_rooms_id_fkey" FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "tenant_detector_predictions" ADD CONSTRAINT "tenant_detector_predictions_tenant_id_users_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "users"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "tenant_detector_state" ADD CONSTRAINT "tenant_detector_state_tenant_id_users_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "tenant_detector_state" ADD CONSTRAINT "tenant_detector_state_ADb7faSKXiAu_fkey" FOREIGN KEY ("latest_prediction_id") REFERENCES "tenant_detector_predictions"("id") ON DELETE RESTRICT;
--> statement-breakpoint
CREATE FUNCTION queue_tenant_detector_source() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  tenant text;
  old_tenant text;
  new_tenant text;
BEGIN
  IF TG_OP <> 'INSERT' THEN
    old_tenant := COALESCE(to_jsonb(OLD)->>'tenant_id', to_jsonb(OLD)->>'occupant_id');
  END IF;
  IF TG_OP <> 'DELETE' THEN
    new_tenant := COALESCE(to_jsonb(NEW)->>'tenant_id', to_jsonb(NEW)->>'occupant_id');
  END IF;
  FOR tenant IN SELECT DISTINCT value FROM unnest(ARRAY[old_tenant, new_tenant]) AS value WHERE value IS NOT NULL LOOP
    INSERT INTO tenant_detector_state (tenant_id, source_revision, pending)
      VALUES (tenant, 1, true)
      ON CONFLICT (tenant_id) DO UPDATE
      SET source_revision = tenant_detector_state.source_revision + 1, pending = true;
  END LOOP;
  RETURN NULL;
END;
$$;
--> statement-breakpoint
CREATE TRIGGER tenant_detector_activity_change AFTER INSERT OR UPDATE OR DELETE ON activities FOR EACH ROW EXECUTE FUNCTION queue_tenant_detector_source();
--> statement-breakpoint
CREATE TRIGGER tenant_detector_plan_change AFTER INSERT OR UPDATE OR DELETE ON recurring_plans FOR EACH ROW EXECUTE FUNCTION queue_tenant_detector_source();
--> statement-breakpoint
CREATE TRIGGER tenant_detector_room_change AFTER INSERT OR UPDATE OR DELETE ON rooms FOR EACH ROW EXECUTE FUNCTION queue_tenant_detector_source();
--> statement-breakpoint
CREATE TRIGGER tenant_detector_coverage_change AFTER INSERT OR UPDATE OR DELETE ON tenant_detector_coverage FOR EACH ROW EXECUTE FUNCTION queue_tenant_detector_source();
