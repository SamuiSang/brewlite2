import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const lucideCandidates = [
  path.resolve(__dirname, 'node_modules/lucide-react/dist/esm/lucide-react.mjs'),
  path.resolve(__dirname, '../../node_modules/lucide-react/dist/esm/lucide-react.mjs'),
];
const lucideEsmPath = lucideCandidates.find((candidate) => fs.existsSync(candidate));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack: (config) => {
    if (lucideEsmPath) {
      config.resolve.alias = {
        ...(config.resolve.alias || {}),
        'lucide-react': lucideEsmPath,
      };
    }
    return config;
  },
  async rewrites() {
    const internalUrl = process.env.API_INTERNAL_URL;
    const publicUrl = process.env.NEXT_PUBLIC_API_URL;
    const rawApiUrl =
      internalUrl ||
      (publicUrl && publicUrl.startsWith('http') ? publicUrl : 'http://localhost:3001');
    const destinationBase = rawApiUrl.endsWith('/api/v1')
      ? rawApiUrl
      : `${rawApiUrl.replace(/\/$/, '')}/api/v1`;
    return [
      {
        source: '/api/v1/:path*',
        destination: `${destinationBase}/:path*`,
      },
    ];
  },
};

export default nextConfig;
