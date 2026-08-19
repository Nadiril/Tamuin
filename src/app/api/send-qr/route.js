import { createServiceClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { buildEmailHtml, sendMail } from "@/lib/email";
import { requireRole } from "@/lib/api-helpers";

export async function POST(request) {
  const { supabase, response } = await requireRole(["admin"]);
  if (response) return response;

  try {
    const { guest_ids, acara_id } = await request.json();

    if (!guest_ids || guest_ids.length === 0 || !acara_id) {
      return NextResponse.json({ error: "guest_ids and acara_id are required" }, { status: 400 });
    }

    const service = await createServiceClient();

    const { data: event } = await service
      .from("events")
      .select("*")
      .eq("id", acara_id)
      .single();

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const { data: guests } = await service
      .from("guests")
      .select("id, nama, email, acara_id, qr_token")
      .in("id", guest_ids);

    if (!guests || guests.length === 0) {
      return NextResponse.json({ error: "Tamu tidak ditemukan" }, { status: 404 });
    }

    const formatDate = (dateStr) =>
      new Date(dateStr).toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    const results = [];

    for (const guest of guests) {
      const emailTo = guest.email;
      if (!emailTo || !emailRegex.test(emailTo)) {
        results.push({ guest_id: guest.id, status: "skipped", reason: "Email tidak valid" });
        continue;
      }

      const html = buildEmailHtml({
        nama: guest.nama,
        acara: event.nama_acara,
        tanggal: formatDate(event.tanggal_mulai),
        lokasi: event.lokasi,
        qrToken: guest.qr_token,
        jamMulai: event.jam_mulai?.slice(0, 5),
        jamSelesai: event.jam_selesai?.slice(0, 5),
      });

      const mailResult = await sendMail({
        to: emailTo,
        subject: `QR Code Kehadiran - ${event.nama_acara}`,
        html,
      });

      if (mailResult.success) {
        await service
          .from("guests")
          .update({ qr_sent_at: new Date().toISOString() })
          .eq("id", guest.id);

        await service.from("email_logs").insert({
          guest_id: guest.id,
          acara_id: acara_id,
          email_to: emailTo,
          status: "sent",
          sent_at: new Date().toISOString(),
        });

        results.push({ guest_id: guest.id, status: "sent" });
      } else {
        await service.from("email_logs").insert({
          guest_id: guest.id,
          acara_id: acara_id,
          email_to: emailTo,
          status: "failed",
          error_message: mailResult.error,
        });

        results.push({ guest_id: guest.id, status: "failed" });
      }
    }

    return NextResponse.json({ results });
  } catch (err) {
    return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });
  }
}
