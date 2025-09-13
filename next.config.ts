import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'coin-images.coingecko.com',
        port: '',
        pathname: '/coins/images/**',
      },
      {
        protocol: 'https',
        hostname: 'raw.githubusercontent.com',
        port: '',
        pathname: '/solana-labs/token-list/main/assets/**',
      },
      {
        protocol: 'https',
        hostname: 'static.coinpaprika.com',
        port: '',
        pathname: '/coin-images/**',
      },
      {
        protocol: 'https',
        hostname: 'assets.coingecko.com',
        port: '',
        pathname: '/coins/images/**',
      },
      {
        protocol: 'https',
        hostname: 'cryptologos.cc',
        port: '',
        pathname: '/logos/**',
      },
      {
        protocol: 'https',
        hostname: 's2.coinmarketcap.com',
        port: '',
        pathname: '/static/img/coins/**',
      },
      {
        protocol: 'https',
        hostname: 'jup.ag',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.jup.ag',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // Оптимизация для Vercel
  serverExternalPackages: ['@solana/web3.js', '@solana/spl-token'],
  // Минимальная webpack конфигурация
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Исключаем только самые тяжелые пакеты
      config.externals = config.externals || [];
      config.externals.push({
        '@solana/web3.js': 'commonjs @solana/web3.js',
      });
    }
    
    return config;
  },
};

export default nextConfig;
