/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'standalone',
    serverExternalPackages: ['better-sqlite3'],
    experimental: {
        instrumentationHook: true,
    },
};

export default nextConfig;
