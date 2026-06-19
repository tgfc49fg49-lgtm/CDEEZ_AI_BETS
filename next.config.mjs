/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
  webpack(config) {
    config.watchOptions = {
      ...(config.watchOptions ?? {}),
      ignored: ["**/work/**", "**/outputs/**", "**/.git/**"]
    };

    return config;
  }
};

export default nextConfig;
