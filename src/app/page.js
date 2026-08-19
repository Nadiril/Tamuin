import Image from "next/image";
import { QrCode, Activity, FileText } from "lucide-react";
import AuthForms from "@/components/auth/AuthForms";

const features = [
  {
    icon: QrCode,
    title: "QR Check-in",
    caption: "Cek-in tamu cukup sekali scan",
  },
  {
    icon: Activity,
    title: "Realtime Monitoring",
    caption: "Pantau kehadiran secara langsung",
  },
  {
    icon: FileText,
    title: "Digital Report",
    caption: "Laporan otomatis & rapi",
  },
];

export default function HomePage() {
  return (
    <div className="font-jakarta relative min-h-screen bg-[#F7F9FC] md:flex md:items-center md:justify-center md:p-6">
      {/* Main container */}
      <div className="relative z-10 flex w-full max-w-[1440px] min-h-screen flex-col md:min-h-[calc(100vh-48px)] md:flex-row md:overflow-hidden md:rounded-[28px] md:bg-white md:shadow-[0_25px_80px_rgba(0,0,0,0.12)]">
        {/* ── Shared background photo (single LCP image) ─────── */}
        <div
          className="fixed inset-0 z-0 md:absolute md:inset-y-0 md:left-0 md:right-auto md:w-1/2 md:bg-[#0A3D91]"
          aria-hidden="true"
        >
          <Image
            src="/login-tamuku.webp"
            alt=""
            fill
            priority
            quality={50}
            sizes="(min-width: 768px) 50vw, 100vw"
            className="object-cover object-center opacity-100 brightness-95 contrast-[1.08] blur-[1px] md:opacity-40 md:blur-[1.5px]"
          />
          {/* Mobile overlay */}
          <div className="absolute inset-0 flex bg-[linear-gradient(180deg,rgba(7,33,94,0.78)_0%,rgba(18,73,181,0.70)_55%,rgba(7,33,94,0.82)_100%)] md:hidden" />
          {/* Desktop overlay */}
          <div className="absolute inset-0 hidden bg-[linear-gradient(135deg,rgba(7,33,94,0.68),rgba(18,73,181,0.72))] md:block" />
          <div className="absolute inset-x-0 bottom-0 hidden h-32 bg-gradient-to-t from-[#0A3D91]/45 to-transparent md:block" />
          {/* Mobile decorative circles */}
          <div className="flex md:hidden">
            <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-[#FFC928]/10 blur-3xl" />
            <div className="absolute -bottom-20 -left-20 h-80 w-80 rounded-full bg-[#1657D9]/30 blur-3xl" />
          </div>
        </div>

        {/* ── Left: Branding ─────────────────────────────── */}
        <aside className="login-noise relative hidden flex-col justify-between overflow-hidden p-8 text-white md:flex md:w-1/2 lg:p-10">
          {/* Desktop decorations */}
          <div
            className="absolute -top-24 -right-24 h-80 w-80 rounded-full bg-[#FFC928]/10 blur-3xl"
            aria-hidden="true"
          />
          <div
            className="absolute -left-16 bottom-16 h-72 w-72 rounded-full bg-[#1657D9]/30 blur-3xl"
            aria-hidden="true"
          />
          <div
            className="login-float absolute -right-14 top-1/4 h-56 w-56 rounded-full border border-white/10"
            aria-hidden="true"
          />
          <div
            className="login-float-slow absolute -right-6 top-[30%] h-36 w-36 rounded-full border border-white/15"
            aria-hidden="true"
          />
          <div
            className="login-shine absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-transparent via-white/10 to-transparent"
            aria-hidden="true"
          />

          {/* Logo */}
          <div className="login-fade-up relative z-10 inline-flex w-fit items-center gap-3 rounded-[18px] border border-white/15 bg-white/10 p-2.5 pr-5 shadow-lg shadow-black/10 backdrop-blur-[18px]">
            <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl bg-white">
              <Image
                src="/Logo.webp"
                alt="Tamuin"
                width={44}
                height={35}
                className="object-contain"
                sizes="44px"
              />
            </div>
            <div className="leading-tight">
              <p className="text-[15px] font-extrabold tracking-[0.08em] text-white">
                Tamuin
              </p>
              <p className="text-[10px] font-medium text-white/60">
                Tamu masuk, semua tercatat.
              </p>
            </div>
          </div>

          {/* Hero */}
          <div className="relative z-10 my-auto flex flex-col py-4 lg:py-6">
            <h1 className="login-fade-up login-delay-2 max-w-[500px] text-[38px] font-extrabold leading-[1.08] tracking-[-0.02em] md:text-[40px] lg:text-[44px] xl:text-[48px]">
              Menyambut
              <br />
              Setiap Tamu
              <br />
              Secara{" "}
              <span className="relative inline-block text-[#FFC928]">
                Digital
                <span className="absolute -bottom-1 left-0 h-[3px] w-full rounded-full bg-[#FFC928]/50" />
              </span>
              .
            </h1>

            <p className="login-fade-up login-delay-3 mt-4 max-w-[520px] text-[15px] leading-[1.8] text-white/85 lg:text-base">
              Platform digital untuk registrasi tamu, QR Check-in, monitoring kehadiran, dan pelaporan acara secara realtime.
            </p>

            <div className="login-fade-up login-delay-4 mt-5 flex flex-col gap-3">
              {features.map(({ icon: Icon, title, caption }) => (
                <div
                  key={title}
                  className="group flex h-14 items-center gap-4 rounded-2xl border border-white/15 bg-white/10 px-4 backdrop-blur-md transition-all duration-200 hover:-translate-y-1 hover:bg-white/15 hover:shadow-xl hover:shadow-black/25 lg:h-16"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[#FFC928]/15 text-[#FFC928] transition-colors duration-200 group-hover:bg-[#FFC928]/25 lg:h-10 lg:w-10">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div className="leading-tight">
                    <p className="text-[16px] font-bold text-white lg:text-[17px]">{title}</p>
                    <p className="mt-0.5 text-[14px] text-white/65">
                      {caption}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="login-fade-up login-delay-5 relative z-10">
            <p className="text-sm font-semibold text-white/80">© 2026 Tamuin</p>
            <p className="mt-0.5 text-[13px] text-white/60">
              Powered by STIKOM PGRI Banyuwangi
            </p>
          </div>
        </aside>

        {/* ── Right: AuthForms Client Component ───────────── */}
        <AuthForms />
      </div>
    </div>
  );
}
