/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'vtxupdmtcbxlncemhmwc.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/gambar/**', // Diperbaiki: tambahkan awalan dan akhiran wildcard
      },
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**', // Diperbaiki: tambahkan awalan dan akhiran wildcard
      }
    ],
  },
};

export default nextConfig;
