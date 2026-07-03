# Staging Environment Setup

## One-time setup

1. Create a new Supabase project at supabase.com for staging
2. Add GitHub Actions secrets:
   - `STAGING_SUPABASE_PROJECT_REF` — the project ref (e.g. `abcdefghijklmnop`)
   - `STAGING_SUPABASE_DB_PASSWORD` — the DB password for the staging project
   - `SUPABASE_ACCESS_TOKEN` — your Supabase personal access token (shared with production)
3. Set the same edge function secrets on the staging project:
   ```
   supabase secrets set --project-ref <STAGING_REF> \
     RESEND_API_KEY=<staging-resend-key> \
     CRON_SECRET=<any-random-string> \
     STRIPE_SECRET_KEY=<stripe-test-key> \
     STRIPE_WEBHOOK_SECRET=<stripe-test-webhook-secret>
   ```

## Workflow

- Push to `staging` branch → auto-deploys to staging environment
- Open a PR to `main` → runs tests (but does not deploy to staging)
- Merge to `main` → auto-deploys to production

## Testing migrations safely

Always test destructive migrations on staging first:
```bash
git checkout staging
git merge feature/my-migration
git push origin staging   # deploys to staging
# verify staging looks correct, then:
git checkout main
git merge feature/my-migration
git push origin main      # deploys to production
```
