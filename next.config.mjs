/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["pg", "sharp"],
  experimental: { serverActions: { bodySizeLimit: "12mb" } },
  images: { unoptimized: true },
};
export default nextConfig;
