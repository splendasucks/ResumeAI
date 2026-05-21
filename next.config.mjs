/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: [
      "mongodb-memory-server",
      "mongodb-memory-server-core",
    ],
  },
};

export default nextConfig;
