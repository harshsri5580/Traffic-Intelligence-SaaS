/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  generateBuildId: async () => {
    return "build";
  },
};

module.exports = nextConfig;