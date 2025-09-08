/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  experimental: {
    serverComponentsExternalPackages: ['@vercel/blob'],
  },
  serverRuntimeConfig: {
    maxFileSize: '30mb',
  },
  // Configure API routes for larger payloads
  api: {
    bodyParser: {
      sizeLimit: '30mb',
    },
  },
}

export default nextConfig
