import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // pdf-parse (pdfjs-dist) precisa ser resolvido em runtime a partir do node_modules,
  // senão o Next empacota e quebra o worker (pdf.worker.mjs).
  serverExternalPackages: ['pdf-parse', 'pdfjs-dist'],
  // O pdf-parse carrega o worker via import() dinâmico ("./pdf.worker.mjs"), que o
  // rastreador do Vercel não detecta. Forçamos a inclusão dos arquivos do worker
  // nas funções que parseiam PDF, senão a função quebra em runtime no deploy.
  outputFileTracingIncludes: {
    '/api/plano/preview': ['./node_modules/pdf-parse/dist/**/*'],
    '/api/plano/confirm': ['./node_modules/pdf-parse/dist/**/*'],
  },
  turbopack: {
    // Fixa o root para evitar conflito com outros package-lock.json em diretórios pais
    root: path.resolve(__dirname),
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },
};

export default nextConfig;
