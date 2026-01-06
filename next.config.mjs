/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'i.postimg.cc',
        port: '',
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '**',
      }
    ],
  },
  webpack: (config, { isServer }) => {
    // Add a rule to handle the optional modules
    config.externals.push('@opentelemetry/exporter-jaeger', '@genkit-ai/firebase');
    
    return config;
  },
};

export default nextConfig;
