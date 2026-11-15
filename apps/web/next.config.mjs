import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:3001/api/:path*',
      },
    ];
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      'lucide-react': path.resolve(__dirname, '../../node_modules/lucide-react/dist/esm/lucide-react.mjs'),
    };
    return config;
  },
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const destinationBase = apiUrl.endsWith('/api/v1') ? apiUrl : `${apiUrl.replace(/\/$/, '')}/api/v1`;
    return [
      {
        source: '/api/v1/:path*',
        destination: `${destinationBase}/:path*`,
      },
    ];
  },
};

export default nextConfig;
