-- Harden notify_search_engines_on_publish() against unset GUCs.
-- When app.supabase_url / app.service_role_key are NULL, net.http_post()
-- fails with a NOT NULL violation on http_request_queue.url, which blocks
-- UPDATE blog_posts SET published = true. Skip the ping in that case.

CREATE OR REPLACE FUNCTION public.notify_search_engines_on_publish()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_url text := current_setting('app.supabase_url', true);
  v_key text := current_setting('app.service_role_key', true);
BEGIN
  IF (NEW.published = true AND (OLD.published IS DISTINCT FROM true)) THEN
    IF v_url IS NOT NULL AND v_url <> '' AND v_key IS NOT NULL AND v_key <> '' THEN
      PERFORM net.http_post(
        url     := v_url || '/functions/v1/ping-search-engines',
        headers := jsonb_build_object(
          'Content-Type',  'application/json',
          'Authorization', 'Bearer ' || v_key
        ),
        body    := jsonb_build_object('trigger', 'blog_publish', 'slug', NEW.slug)
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;
