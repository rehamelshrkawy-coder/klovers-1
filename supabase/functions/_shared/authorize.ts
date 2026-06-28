import { createClient, type SupabaseClient, type User } from "https://esm.sh/@supabase/supabase-js@2";

export type AccessLevel = "authenticated" | "admin" | "service" | "admin-or-service";

export type AuthorizationResult =
  | { ok: true; user: User | null; serviceClient: SupabaseClient }
  | { ok: false; status: 401 | 403 | 500; error: string };

function bearerToken(req: Request): string | null {
  const header = req.headers.get("authorization")?.trim();
  if (!header?.startsWith("Bearer ")) return null;
  const token = header.slice(7).trim();
  return token || null;
}

/**
 * Authorize Edge Function requests that run with the service-role client.
 * Gateway JWT checks are intentionally disabled for cron/webhook compatibility,
 * so privileged handlers must call this before reading the request body.
 */
export async function authorizeRequest(
  req: Request,
  access: AccessLevel,
): Promise<AuthorizationResult> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) {
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    return { ok: false, status: 500, error: "Server authorization is not configured" };
  }

  const token = bearerToken(req);
  const serviceClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const isService = token === serviceRoleKey;
  if (access === "service" || (access === "admin-or-service" && isService)) {
    return isService
      ? { ok: true, user: null, serviceClient }
      : { ok: false, status: 401, error: "Unauthorized" };
  }

  if (!token) return { ok: false, status: 401, error: "Authentication required" };

  const { data: { user }, error: userError } = await serviceClient.auth.getUser(token);
  if (userError || !user) return { ok: false, status: 401, error: "Invalid or expired session" };

  if (access === "authenticated") return { ok: true, user, serviceClient };

  const { data: role, error: roleError } = await serviceClient
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "admin")
    .maybeSingle();

  if (roleError) {
    console.error("Admin authorization lookup failed", roleError);
    return { ok: false, status: 500, error: "Authorization check failed" };
  }
  if (!role) return { ok: false, status: 403, error: "Admin access required" };

  return { ok: true, user, serviceClient };
}

export function authorizationError(
  result: Extract<AuthorizationResult, { ok: false }>,
  headers: HeadersInit = {},
): Response {
  return new Response(JSON.stringify({ error: result.error }), {
    status: result.status,
    headers: { ...headers, "Content-Type": "application/json" },
  });
}
