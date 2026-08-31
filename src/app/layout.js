import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  display: "swap",
});

const supabaseUrl = "https://iksogaopebiyhnykalnb.supabase.co";

export const metadata = {
  title: "Tamuin",
  description:
    "Tamuin — platform digital untuk registrasi tamu, QR Check-in, monitoring kehadiran, dan pelaporan acara.",
  openGraph: {
    title: "Tamuin",
    description:
      "Tamuin — platform digital untuk registrasi tamu, QR Check-in, monitoring kehadiran, dan pelaporan acara.",
    siteName: "Tamuin",
    locale: "id_ID",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Tamuin",
    description:
      "Tamuin — platform digital untuk registrasi tamu, QR Check-in, monitoring kehadiran, dan pelaporan acara.",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#2563eb",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="id"
      className={`${plusJakartaSans.variable} h-full antialiased dark`}
      suppressHydrationWarning
    >
      <head>
        <link rel="preconnect" href={supabaseUrl} />
        <link rel="dns-prefetch" href={supabaseUrl} />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}