import Sidebar from "@/components/Sidebar";
import SessionTimeout from "@/components/SessionTimeout";
import AuthGuard from "@/components/AuthGuard";

export const metadata = {
  title: "Admin — Tamuin",
  description: "Panel admin Tamuin.",
};

export default function PanelLayout({ children }) {
  return (
    <AuthGuard>
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 flex flex-col min-w-0 lg:ml-[var(--sidebar-w,16rem)]">
          {children}
        </main>
        <SessionTimeout role="admin" />
      </div>
    </AuthGuard>
  );
}
