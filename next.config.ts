import type { NextConfig } from "next";
import path from "path";
import { readFileSync } from "fs";

// Em git worktree, node_modules fica na raiz do projeto (3 níveis acima de .claude/worktrees/<name>)
const projectRoot = __dirname.includes(".claude") && __dirname.includes("worktrees")
  ? path.resolve(__dirname, "../../..")
  : __dirname

// Versão da app = fonte única em package.json (bump via `npm run patch|end-sprint|release`).
// Exposta ao app (rodapé) como NEXT_PUBLIC_APP_VERSION — só a string da versão, sem vazar o resto do package.json.
const APP_VERSION = (JSON.parse(
  readFileSync(path.join(__dirname, "package.json"), "utf8")
) as { version: string }).version

const nextConfig: NextConfig = {
  outputFileTracingRoot: projectRoot,
  output: 'standalone',

  // Versão exposta ao cliente (rodapé público)
  env: {
    NEXT_PUBLIC_APP_VERSION: APP_VERSION,
  },

  // ✅ Headers de segurança HTTP (OWASP A05)
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // Impede clickjacking — bloqueia iframe por domínios externos
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          // Impede MIME-type sniffing
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Limita informação de referência enviada a terceiros
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Restringe acesso a APIs sensíveis do navegador
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          // Content Security Policy — permite Cloudinary, Google (OAuth + Places) e Resend
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              // Scripts: próprios + Google (OAuth popup)
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com",
              // Estilos: próprios + inline (Tailwind/shadcn gerado)
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              // Fontes
              "font-src 'self' https://fonts.gstatic.com",
              // Imagens: próprios + Cloudinary + Google (Places photos, avatars) + GitHub
              "img-src 'self' data: blob: https://res.cloudinary.com https://*.googleusercontent.com https://places.googleapis.com https://maps.googleapis.com https://*.ggpht.com https://avatars.githubusercontent.com",
              // Conexões de API: próprios + Cloudinary + Resend
              "connect-src 'self' https://api.cloudinary.com https://api.resend.com",
              // Mapa interativo do perfil (OpenStreetMap embed)
              "frame-src 'self' https://www.openstreetmap.org",
              // Bloqueia tudo que não se enquadrar acima
              "base-uri 'self'",
              "form-action 'self'",
              "upgrade-insecure-requests",
            ].join("; "),
          },
        ],
      },
    ]
  },

  turbopack: {
    root: projectRoot,
  },

  images: {
    unoptimized: false,
    qualities: [25, 50, 75, 100],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'places.googleapis.com',
      },
    ],
  },

  webpack: (config, { dev }) => {
    if (dev) {
      config.devtool = 'cheap-module-source-map';
    }
    return config;
  },
};

export default nextConfig;
