const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: { unoptimized: true },
  // Source maps optimisés pour la production
  productionBrowserSourceMaps: false,
  // Optimisation du bundle
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
  // Note: Les headers de sécurité HTTP ne peuvent pas être configurés dans next.config.js
  // avec output: 'export'. Ils doivent être configurés au niveau du serveur web ou
  // de la plateforme d'hébergement. Voir docs/SECURITY.md pour les instructions.
  // Optimisations maintenant stables dans Next.js 16
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-select',
      '@radix-ui/react-tabs',
      '@radix-ui/react-scroll-area',
      '@radix-ui/react-alert-dialog',
      '@radix-ui/react-popover',
    ],
  },
  // Configuration webpack pour optimiser les chunks
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            default: false,
            vendors: false,
            // Framework chunk (React, React-DOM)
            framework: {
              name: 'framework',
              chunks: 'all',
              test: /[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/,
              priority: 50,
              enforce: true,
            },
            // Supabase chunk
            supabase: {
              name: 'supabase',
              test: /[\\/]node_modules[\\/]@supabase[\\/]/,
              priority: 45,
              enforce: true,
            },
            // Date-fns chunk
            dateFns: {
              name: 'date-fns',
              test: /[\\/]node_modules[\\/]date-fns[\\/]/,
              priority: 40,
              enforce: true,
            },
            // Lucide icons chunk
            lucide: {
              name: 'lucide',
              test: /[\\/]node_modules[\\/]lucide-react[\\/]/,
              priority: 35,
              enforce: true,
            },
            // Chunk séparé pour react-markdown et ses dépendances
            markdown: {
              name: 'markdown',
              test: /[\\/]node_modules[\\/](react-markdown|remark-gfm|unified|micromark|mdast)[\\/]/,
              priority: 30,
              enforce: true,
            },
            // Chunk pour les composants UI Radix
            radix: {
              name: 'radix',
              test: /[\\/]node_modules[\\/]@radix-ui[\\/]/,
              priority: 25,
              enforce: true,
            },
            // Admin routes chunk
            admin: {
              name: 'admin',
              test: /[\\/]app[\\/]admin[\\/]/,
              priority: 20,
              enforce: true,
              minSize: 10000,
            },
            // Vendor chunk pour les dépendances restantes
            vendor: {
              name: 'vendor',
              chunks: 'all',
              test: /[\\/]node_modules[\\/]/,
              priority: 10,
              minSize: 20000,
            },
          },
        },
      };
    }
    return config;
  },
};

module.exports = withBundleAnalyzer(nextConfig);
