import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const JSON_HEADERS = { "Content-Type": "application/json" };

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export function errorResponse(error: unknown, headers: HeadersInit = {}): Response {
  const status = error instanceof HttpError ? error.status : 500;
  const message = error instanceof HttpError ? error.message : "Internal server error";
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...JSON_HEADERS, ...headers },
  });
}

/**
 * Authenticates the caller against Supabase Auth and verifies the admin role
 * using a service-role client. Never trust role/email claims supplied in the
 * request body or unverified JWT payloads.
 */
export async function requireAdmin(req: Request): Promise<string> {
  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) {
    throw new HttpError(401, "Authentication required");
  }

  const url = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !anonKey || !serviceKey) {
    throw new HttpError(500, "Server authentication is not configured");
  }

  const authClient = createClient(url, anonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: { user }, error } = await authClient.auth.getUser();
  if (error || !user) throw new HttpError(401, "Invalid or expired session");

  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: role, error: roleError } = await admin
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "admin")
    .maybeSingle();
  if (roleError) throw new HttpError(500, "Unable to verify authorization");
  if (!role) throw new HttpError(403, "Admin access required");
  return user.id;
}

export function requirePost(req: Request): void {
  if (req.method !== "POST") throw new HttpError(405, "Method not allowed");
}

export function assertString(value: unknown, name: string, maxLength: number): string {
  if (typeof value !== "string") throw new HttpError(400, `${name} must be a string`);
  const result = value.trim();
  if (!result || result.length > maxLength) {
    throw new HttpError(400, `${name} must be between 1 and ${maxLength} characters`);
  }
  return result;
}
