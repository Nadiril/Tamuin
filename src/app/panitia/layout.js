import AuthGuard from "@/components/AuthGuard";
import PanitiaLayout from "@/components/panitia/PanitiaLayout";

export const metadata = {
  title: "Panel Panitia — Tamuin",
  description: "Panel Panitia Tamuin Multi-Event",
};

export default function Layout({ children }) {
  return (
    <AuthGuard>
      <PanitiaLayout>{children}</PanitiaLayout>
    </AuthGuard>
  );
}
