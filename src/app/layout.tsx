// src/app/layout.tsx
import type { Metadata } from "next";
import { Inter, Playfair_Display, Open_Sans, Roboto } from "next/font/google";
import "./globals.css";
import { SessionAuthProvider } from "@/components/session-auth";
import { QueryClientContext } from "@/providers/queryclient";
import { Toaster } from "sonner";
import Script from "next/script";

// Google Analytics 4 — o ID de medição é público (vai no HTML de qualquer forma).
// Só ATIVA em produção: assim o tráfego de dev/localhost não polui as métricas reais.
// O env NEXT_PUBLIC_GA_ID sobrepõe o padrão, se um dia quiser trocar sem mexer no código.
const GA_ID =
  process.env.NODE_ENV === "production"
    ? process.env.NEXT_PUBLIC_GA_ID || "G-SXDHG23V5B"
    : undefined;

// Flora Design System — Playfair Display (títulos) + Inter (corpo/UI)
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const openSans = Open_Sans({
  variable: "--font-open-sans",
  subsets: ["latin"],
  weight: ["300", "400", "600", "700", "800"],
});

// Roboto — usada na versão do rodapé (cara de "build number")
const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://acheinojardimbotanico.com.br"),
  title: {
    default: "Achei no Jardim Botânico",
    template: "%s | Achei no Jardim Botânico",
  },
  description: "Guia comercial digital hiperlocal do Jardim Botânico (DF). Encontre negócios, serviços e estabelecimentos próximos com informações confiáveis e atualizadas.",
  keywords: ["jardim botânico", "brasília", "comércio local", "guia comercial", "negócios jardim botânico df"],
  authors: [{ name: "Achei no Jardim Botânico", url: "https://acheinojardimbotanico.com.br" }],
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "https://acheinojardimbotanico.com.br",
    siteName: "Achei no Jardim Botânico",
    title: "Achei no Jardim Botânico — Guia comercial local",
    description: "Encontre negócios, serviços e estabelecimentos na região do Jardim Botânico (DF).",
  },
  twitter: {
    card: "summary_large_image",
    title: "Achei no Jardim Botânico",
    description: "Guia comercial digital hiperlocal do Jardim Botânico (DF).",
  },
  robots: {
    index: true,
    follow: true,
  },
  // Verificação do Google Search Console (cole o código em NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION)
  ...(process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
    ? { verification: { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION } }
    : {}),
};

// Script injetado no <head> — executa ANTES do React hidratar.
// Lê a preferência salva e aplica a classe .dark no <html> imediatamente,
// evitando o flash de tema errado na primeira renderização.
const themeScript = `
(function(){
  try {
    var t = localStorage.getItem('cfy-theme');
    if (t === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      // padrão é CLARO (primeiro acesso); usuário escolhe depois
      document.documentElement.classList.remove('dark');
    }
  } catch(e) {
    document.documentElement.classList.remove('dark');
  }
})();
`.trim();

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      {/* Script de tema roda antes da hidratação — sem flash */}
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body
        className={`${inter.variable} ${playfair.variable} ${openSans.variable} ${roboto.variable} antialiased`}
        suppressHydrationWarning
      >
        <SessionAuthProvider>
          <QueryClientContext>
            {children}
            <Toaster position="top-right" richColors duration={2500} />
          </QueryClientContext>
        </SessionAuthProvider>

        {/* Google Analytics 4 — só em produção (ver GA_ID acima) */}
        {GA_ID && (
          <>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
            <Script id="ga4" strategy="afterInteractive">
              {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA_ID}');`}
            </Script>
          </>
        )}
      </body>
    </html>
  );
}
