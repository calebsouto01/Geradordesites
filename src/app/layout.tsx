import type { Metadata } from "next";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "https://geradordesites-plum.vercel.app"),
  title: "Gerador de Sites",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `try{var t=localStorage.getItem("theme");if(t)document.documentElement.dataset.theme=t}catch(e){}` }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
