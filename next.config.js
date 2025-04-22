/** @type {import('next').NextConfig} */
const nextConfig = {
  // Using standalone output instead of export for API routes
  output: 'standalone',
  images: {
    unoptimized: true,
    domains: [
      'res.cloudinary.com',
      'api.dicebear.com',
      'images.unsplash.com',
      'images.pexels.com'
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  reactStrictMode: true,
  
  // Fix for static asset issues
  assetPrefix: process.env.NODE_ENV === 'production' ? undefined : '',
  
  // Improved static file handling
  staticPageGenerationTimeout: 120,
  
  // Disable tracing by setting options at the top level
  outputFileTracingRoot: false,
  outputFileTracingExcludes: {
    '*': ['**/*'],
  },
  
  // External packages to be bundled server-side
  serverExternalPackages: [],
  
  // Disable TypeScript checking during build
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
  
  // Experimental features and optimizations
  experimental: {
    // Disable optimized loading for better reliability
    disableOptimizedLoading: true,
    optimizeCss: true,
  },
  
  // Handling Node.js modules for browser
  webpack: (config, { isServer, dev }) => {
    if (!isServer) {
      // Don't resolve 'fs', 'path', etc. on the client to prevent errors
      config.resolve.fallback = {
        fs: false,
        path: false,
        crypto: false,
        stream: false,
        http: false,
        https: false,
        zlib: false,
        url: false,
        querystring: false,
        os: false,
      };
    }
    
    // Fix for handlebars require.extensions issue
    config.module.rules.push({
      test: /\.handlebars$/,
      loader: 'handlebars-loader',
    });
    
    // Ignore require.extensions warnings
    config.ignoreWarnings = [
      { module: /node_modules\/handlebars\/lib\/index\.js/ },
      { message: /require\.extensions is not supported by webpack/ },
    ];
    
    // Disable cache for development mode to prevent cache-related errors
    if (dev) {
      config.cache = false;
    }
    
    return config;
  },
  
  // Control caching for static assets
  headers: async () => {
    return [
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
}

// Temporarily disable PWA for testing
// const withPWA = require('next-pwa')({
//   dest: 'public',
//   disable: process.env.NODE_ENV === 'development'
// });

// module.exports = withPWA(nextConfig)
module.exports = nextConfig; 