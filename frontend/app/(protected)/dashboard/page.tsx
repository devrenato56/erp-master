"use client";

import { useRouter } from "next/navigation";
import { useSession } from "@/lib/supabase/session-context";
import { getSupabase } from "@/lib/supabase/client";

export default function DashboardPage() {
  const { user } = useSession();
  const router = useRouter();

  async function handleLogout() {
    await getSupabase().auth.signOut();
    router.replace("/login");
  }

  return (
    <div style={{ minHeight: "100vh", padding: "48px 32px" }}>
      <div style={{ maxWidth: "600px", margin: "0 auto" }}>
        <p
          style={{
            fontSize: "11px",
            fontWeight: 500,
            letterSpacing: "0.08em",
            color: "var(--text-muted)",
            textTransform: "uppercase",
            marginBottom: "16px",
          }}
        >
          Dashboard
        </p>
        <h1
          style={{
            fontSize: "22px",
            fontWeight: 600,
            color: "var(--text-primary)",
            marginBottom: "8px",
          }}
        >
          Bienvenido, {user?.user_metadata?.nombre ?? user?.email}
        </h1>
        <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginBottom: "32px" }}>
          {user?.email}
        </p>

        <div
          style={{
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-md)",
            padding: "16px 20px",
            backgroundColor: "var(--bg-surface)",
            marginBottom: "24px",
          }}
        >
          <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
            Sesión activa — ID de usuario:
          </p>
          <p
            style={{
              fontSize: "12px",
              color: "var(--text-muted)",
              marginTop: "4px",
              wordBreak: "break-all",
            }}
          >
            {user?.id}
          </p>
        </div>

        <button
          onClick={handleLogout}
          style={{
            backgroundColor: "transparent",
            border: "1px solid var(--border-strong)",
            borderRadius: "var(--radius-sm)",
            padding: "10px 16px",
            fontSize: "14px",
            color: "var(--text-primary)",
            cursor: "pointer",
          }}
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}
