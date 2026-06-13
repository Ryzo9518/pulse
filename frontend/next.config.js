/** @type {import('next').NextConfig} */
const nextConfig = {
  // Supabase image domains (for storage)
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/**',
      },
    ],
  },
}

module.exports = nextConfig
