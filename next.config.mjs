/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    // skipTrailingSlashRedirect: true,
    async rewrites() {
        return [
            {
                source: '/github-web',
                destination: 'https://github.com',
            },
            {
                source: '/api/superset/:chart',
                destination: 'https://superset.datatest.ch/superset/dashboard/:chart/?standalone=3'
            }
        ]
    },
};

export default nextConfig;
