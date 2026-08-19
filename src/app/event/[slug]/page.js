import { createPublicClient } from "@/lib/supabase/server";
import GuestForm from "@/components/event/GuestForm";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const supabase = await createPublicClient();
  const { data: event } = await supabase
    .from("events")
    .select("nama_acara")
    .eq("slug", slug)
    .single();

  return {
    title: event ? `${event.nama_acara} — Registrasi Tamu` : "Registrasi Tamu",
    description: event
      ? `Daftar kehadiran untuk acara ${event.nama_acara}.`
      : "Registrasi kehadiran tamu.",
  };
}

export default async function GuestFormPage({ params }) {
  const { slug } = await params;
  const supabase = await createPublicClient();
  const { data: event, error } = await supabase
    .from("events")
    .select("id, nama_acara, slug, lokasi, tanggal_mulai, jam_mulai, status")
    .eq("slug", slug)
    .single();

  if (error || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-20 h-20 rounded-2xl bg-danger-muted mx-auto flex items-center justify-center mb-5">
            <svg className="w-10 h-10 text-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Acara Tidak Ditemukan</h1>
          <p className="text-muted text-sm max-w-xs mx-auto">Link yang Anda akses tidak valid atau acara sudah tidak tersedia.</p>
        </div>
      </div>
    );
  }

  return <GuestForm event={event} />;
}