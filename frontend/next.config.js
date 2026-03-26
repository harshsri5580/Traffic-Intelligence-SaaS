/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  images: {
    unoptimized: true,
  },
  generateBuildId: async () => {
    return "build";
  },
};

module.exports = nextConfig;