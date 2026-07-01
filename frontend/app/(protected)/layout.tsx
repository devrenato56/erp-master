"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useSession } from "@/lib/supabase/session-context";
import { useBreakpoint } from "@/lib/use-breakpoint";
import { Sidebar } from "@/components/sidebar";

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { session, loading } = useSession();
  const router = useRouter();
  const { isMobile } = useBreakpoint();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!loading && !session) {
      router.replace("/login");
    }
  }, [session, loading, router]);

  // Cerrar drawer al cambiar a desktop
  useEffect(() => {
    if (!isMobile) setSidebarOpen(false);
  }, [isMobile]);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>Cargando...</p>
      </div>
    );
  }

  if (!session) return null;

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* ── Desktop: sidebar fijo ── */}
      {!isMobile && <Sidebar />}

      {/* ── Mobile: overlay drawer ── */}
      {isMobile && sidebarOpen && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setSidebarOpen(false)}
            style={{
              position: "fixed", inset: 0, zIndex: 40,
              backgroundColor: "rgba(0,0,0,0.6)",
            }}
          />
          {/* Drawer */}
          <div style={{ position: "fixed", left: 0, top: 0, bottom: 0, zIndex: 50 }}>
            <Sidebar onClose={() => setSidebarOpen(false)} />
          </div>
        </>
      )}

      <main style={{ flex: 1, overflowY: "auto", minWidth: 0 }}>
        {/* ── Mobile: topbar con hamburger ── */}
        {isMobile && (
          <div style={{
            display: "flex", alignItems: "center", gap: "12px",
            padding: "12px 16px", borderBottom: "1px solid var(--border)",
            backgroundColor: "var(--bg-surface)", position: "sticky", top: 0, zIndex: 30,
          }}>
            <button
              onClick={() => setSidebarOpen(true)}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                width: "32px", height: "32px",
                background: "none", border: "none", cursor: "pointer",
                color: "var(--text-secondary)", borderRadius: "var(--radius-sm)",
              }}
            >
              <Menu size={18} />
            </button>
            <span style={{ fontSize: "15px", fontWeight: 600, color: "var(--text-primary)", letterSpacing: "-0.01em" }}>
              ChatERP
            </span>
            {sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(false)}
                style={{
                  marginLeft: "auto", display: "flex", alignItems: "center", justifyContent: "center",
                  width: "32px", height: "32px",
                  background: "none", border: "none", cursor: "pointer",
                  color: "var(--text-secondary)",
                }}
              >
                <X size={18} />
              </button>
            )}
          </div>
        )}
        {children}
      </main>
    </div>
  );
}
