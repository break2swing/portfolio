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
  // Simplifiée pour éviter les problèmes avec Next.js 16 en mode export statique
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Utiliser la configuration par défaut de Next.js avec quelques ajustements
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          ...config.optimization.splitChunks,
          cacheGroups: {
            ...config.optimization.splitChunks?.cacheGroups,
            default: false,
            vendors: false,
            // Framework chunk (React, React-DOM) - garder cette optimisation
            framework: {
              name: 'framework',
              chunks: 'all',
              test: /[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/,
              priority: 50,
              enforce: true,
            },
          },
        },
      };
    }
    return config;
  },
};

module.exports = withBundleAnalyzer(nextConfig);
