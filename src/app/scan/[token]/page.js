import { createPublicClient } from "@/lib/supabase/server";
import ScanConfirm from "@/components/scan/ScanConfirm";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const { token } = await params;
  const supabase = await createPublicClient();
  const { data: guest } = await supabase
    .from("guests")
    .select("nama, events!inner(nama_acara)")
    .eq("qr_token", token)
    .single();

  return {
    title: guest ? `Konfirmasi Kehadiran — ${guest.nama}` : "Konfirmasi Kehadiran",
    description: "Konfirmasi kehadiran tamu melalui QR Code.",
  };
}

export default async function ScanPage({ params }) {
  const { token } = await params;
  const supabase = await createPublicClient();
  const { data: guest, error } = await supabase
    .from("guests")
    .select("id, nama, nama_mahasiswa, alamat, instansi, kategori_tamu, status_kehadiran, waktu_kedatangan, events!inner(id, nama_acara, lokasi, tanggal_mulai, jam_mulai, jam_selesai, grace_period_minutes, status)")
    .eq("qr_token", token)
    .single();

  if (error || !guest) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 rounded-2xl bg-danger-muted mx-auto flex items-center justify-center mb-5">
            <svg className="w-10 h-10 text-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-foreground mb-2">QR Code Tidak Valid</h1>
          <p className="text-sm text-muted">QR Code yang Anda scan tidak dikenali dalam sistem.</p>
        </div>
      </div>
    );
  }

  return <ScanConfirm token={token} guest={guest} />;
}