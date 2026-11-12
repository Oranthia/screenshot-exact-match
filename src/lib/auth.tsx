import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { getSession, onAuthChange, type AuthSession as Session } from "@/data/backend";

type AuthState = { session: Session | null; loading: boolean };
const AuthContext = createContext<AuthState>({ session: null, loading: true });

export function AuthProvider({ children, onIdentityChange }: { children: ReactNode; onIdentityChange?: (event: string) => void }) {
  const [state, setState] = useState<AuthState>({ session: null, loading: true });
  useEffect(() => {
    const unsubscribe = onAuthChange((event, session) => {
      setState({ session, loading: false });
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") onIdentityChange?.(event);
    });
    getSession().then((session) => setState({ session, loading: false }));
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
