import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'coin-images.coingecko.com',
        port: '',
        pathname: '/coins/images/**',
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
