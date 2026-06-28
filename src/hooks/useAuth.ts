import { useAuthContext } from "@/contexts/AuthContext";

/** Reads the single application-wide Supabase auth subscription. */
export const useAuth = useAuthContext;
