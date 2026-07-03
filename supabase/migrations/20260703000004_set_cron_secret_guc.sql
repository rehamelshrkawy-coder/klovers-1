-- Apply the app.cron_secret GUC so pg_cron can authenticate to send-trial-followups.
-- The GUC was defined in 20260427010000 but the ALTER DATABASE was commented out.
-- Without this, current_setting('app.cron_secret', true) returns NULL and every
-- hourly trial follow-up cron call returns 401 silently.
--
-- Reads the secret from Supabase Vault so it never appears in plaintext SQL.
-- Run: supabase secrets set CRON_SECRET=<value> before applying this migration.

DO $$
BEGIN
  -- Only set if vault secret exists; if not, skip gracefully so CI doesn't fail.
  IF EXISTS (
    SELECT 1 FROM vault.decrypted_secrets WHERE name = 'CRON_SECRET'
  ) THEN
    EXECUTE format(
      'ALTER DATABASE postgres SET app.cron_secret = %L',
      (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'CRON_SECRET')
    );
  ELSE
    RAISE NOTICE 'CRON_SECRET not found in vault — skipping app.cron_secret GUC. Set it with: supabase secrets set CRON_SECRET=<value>';
  END IF;
END;
$$;
