-- Least-privilege access. Passwords are never stored here; set them with
-- `npm run db:set-password` (the verifier is hashed on the client side).
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'bnpnama_app') THEN
    CREATE ROLE bnpnama_app NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'bnpnama_scanner') THEN
    CREATE ROLE bnpnama_scanner NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT;
  END IF;
END $$;

ALTER ROLE bnpnama_app SET search_path = bnpnama, pg_catalog;
ALTER ROLE bnpnama_app SET statement_timeout = '8s';
ALTER ROLE bnpnama_app SET lock_timeout = '4s';
ALTER ROLE bnpnama_app SET idle_in_transaction_session_timeout = '15s';
ALTER ROLE bnpnama_scanner SET search_path = bnpnama, pg_catalog;
ALTER ROLE bnpnama_scanner SET statement_timeout = '15s';
ALTER ROLE bnpnama_scanner SET idle_in_transaction_session_timeout = '30s';

GRANT USAGE ON SCHEMA bnpnama TO bnpnama_app, bnpnama_scanner;

GRANT SELECT, INSERT, UPDATE ON bnpnama.reports TO bnpnama_app;
GRANT SELECT, INSERT ON bnpnama.source_links, bnpnama.accused, bnpnama.supports TO bnpnama_app;
GRANT SELECT, INSERT ON bnpnama.evidence TO bnpnama_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON bnpnama.submission_intents, bnpnama.upload_files TO bnpnama_app;
GRANT SELECT, INSERT, UPDATE ON bnpnama.upload_budget TO bnpnama_app;
GRANT SELECT, INSERT, UPDATE ON bnpnama.staff TO bnpnama_app;
GRANT SELECT, INSERT, DELETE ON bnpnama.staff_sessions, bnpnama.admin_sessions, bnpnama.challenges TO bnpnama_app;
GRANT SELECT, INSERT, UPDATE ON bnpnama.totp_replay TO bnpnama_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON bnpnama.rate_limits TO bnpnama_app;
GRANT SELECT, UPDATE ON bnpnama.meta TO bnpnama_app;
-- Append-only: the application can never alter or remove audit history.
GRANT SELECT, INSERT ON bnpnama.audit_log TO bnpnama_app;

-- The scanner sees evidence metadata only: never reports, accused details, staff or sessions.
GRANT SELECT, UPDATE ON bnpnama.evidence TO bnpnama_scanner;
GRANT SELECT, UPDATE ON bnpnama.upload_budget TO bnpnama_scanner;
GRANT INSERT ON bnpnama.audit_log TO bnpnama_scanner;

-- Row level security: on for every table, with no policy for any Supabase API role,
-- so even a future accidental grant or schema exposure returns nothing.
DO $$
DECLARE t text;
BEGIN
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'bnpnama' LOOP
    EXECUTE format('ALTER TABLE bnpnama.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('CREATE POLICY app_access ON bnpnama.%I TO bnpnama_app USING (true) WITH CHECK (true)', t);
  END LOOP;
END $$;
CREATE POLICY scanner_evidence ON bnpnama.evidence TO bnpnama_scanner USING (true) WITH CHECK (true);
CREATE POLICY scanner_budget ON bnpnama.upload_budget TO bnpnama_scanner USING (true) WITH CHECK (true);
CREATE POLICY scanner_audit ON bnpnama.audit_log FOR INSERT TO bnpnama_scanner WITH CHECK (true);

-- Supabase API roles exist only on Supabase; plain PostgreSQL skips them.
DO $$
DECLARE r text;
BEGIN
  FOREACH r IN ARRAY ARRAY['anon','authenticated','service_role'] LOOP
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = r) THEN
      EXECUTE format('REVOKE ALL ON SCHEMA bnpnama FROM %I', r);
      EXECUTE format('REVOKE ALL ON ALL TABLES IN SCHEMA bnpnama FROM %I', r);
      EXECUTE format('REVOKE ALL ON ALL SEQUENCES IN SCHEMA bnpnama FROM %I', r);
      EXECUTE format('REVOKE ALL ON ALL ROUTINES IN SCHEMA bnpnama FROM %I', r);
    END IF;
  END LOOP;
END $$;
REVOKE ALL ON ALL TABLES IN SCHEMA bnpnama FROM PUBLIC;
ALTER DEFAULT PRIVILEGES IN SCHEMA bnpnama REVOKE ALL ON TABLES FROM PUBLIC;
ALTER DEFAULT PRIVILEGES IN SCHEMA bnpnama REVOKE ALL ON ROUTINES FROM PUBLIC;
