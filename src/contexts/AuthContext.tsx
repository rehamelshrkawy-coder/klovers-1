import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
}

const AuthContext = createContext<AuthState | null>(null);
const EMPTY_AUTH_STATE: AuthState = { user: null, session: null, loading: true };

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(EMPTY_AUTH_STATE);

  useEffect(() => {
    let active = true;
    const updateSession = (session: Session | null) => {
      if (active) setState({ user: session?.user ?? null, session, loading: false });
    };

    void supabase.auth.getSession().then(({ data }) => updateSession(data.session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => updateSession(session),
    );

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const value = useMemo(
    () => ({ user: state.user, session: state.session, loading: state.loading }),
    [state.user, state.session, state.loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext(): AuthState {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
