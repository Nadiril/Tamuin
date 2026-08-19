import Providers from "@/app/providers";

export const metadata = {
  title: "Tamuin",
  description: "Panel admin Tamuin.",
};

export default function AdminLayout({ children }) {
  return <Providers>{children}</Providers>;
}
