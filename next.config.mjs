/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // These modules are optional dependencies of genkit and @opentelemetry/sdk-node.
    // They are not used in the app, so we can ignore them to prevent build warnings.
    if (isServer) {
      config.externals.push('@opentelemetry/exporter-jaeger');
      config.externals.push('@genkit-ai/firebase');
    }
    config.resolve.alias['@opentelemetry/exporter-jaeger'] = false;
    config.resolve.alias['@genkit-ai/firebase'] = false;
    
    return config;
  },
};

export default nextConfig;
