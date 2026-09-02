"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import PanitiaSidebar from "./PanitiaSidebar";
import PanitiaNavbar from "./PanitiaNavbar";
import Providers from "@/app/providers";
import SessionTimeout from "@/components/SessionTimeout";
import { useProfileQuery } from "@/lib/queries/useProfileQuery";

function PanitiaLayoutInner({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const routerRef = useRef(router);
  routerRef.current = router;
  const { data: profile, isLoading } = useProfileQuery();
  const panitiaName = profile?.display_name || "Panitia";
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !profile) {
      routerRef.current.push("/");
    }
  }, [isLoading, profile]);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const handle = (e) => {
      if (!e.matches) setCollapsed(false);
    };
    mq.addEventListener("change", handle);
    return () => mq.removeEventListener("change", handle);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <PanitiaSidebar
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((c) => !c)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />
      <div className={`transition-all duration-300 ${collapsed ? "lg:ml-[72px]" : "lg:ml-[260px]"}`}>
        <PanitiaNavbar
          panitiaName={panitiaName}
          collapsed={collapsed}
          mobileOpen={mobileOpen}
          onToggleMobile={() => setMobileOpen((prev) => !prev)}
        />
        <main className="flex-1">
          {children}
        </main>
      </div>
      <SessionTimeout role="panitia" />
    </div>
  );
}

export default function PanitiaLayout({ children }) {
  return (
    <Providers>
      <PanitiaLayoutInner>{children}</PanitiaLayoutInner>
    </Providers>
  );
}
