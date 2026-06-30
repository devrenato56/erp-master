"use client";

import { SessionProvider } from "@/lib/supabase/session-context";

export function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
