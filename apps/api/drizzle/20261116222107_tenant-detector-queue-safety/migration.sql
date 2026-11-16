CREATE OR REPLACE FUNCTION queue_tenant_detector_source() RETURNS trigger LANGUAGE plpgsql AS $$
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
  FOR tenant IN SELECT DISTINCT value FROM unnest(ARRAY[old_tenant, new_tenant]) AS value WHERE value IS NOT NULL ORDER BY value LOOP
    INSERT INTO tenant_detector_state (tenant_id, source_revision, pending)
      SELECT tenant, 1, true WHERE EXISTS (SELECT 1 FROM users WHERE id = tenant)
      ON CONFLICT (tenant_id) DO UPDATE
      SET source_revision = tenant_detector_state.source_revision + 1, pending = true;
  END LOOP;
  RETURN NULL;
END;
$$;
