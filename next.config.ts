const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
});

const nextConfig = {
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },
};

module.exports = withPWA(nextConfig);
// import withPWA from 'next-pwa';
// import type { Configuration as WebpackConfig } from 'webpack';

// const pwaConfig = withPWA({
//   dest: 'public',
//   register: true,
//   skipWaiting: true,
// });

// if (!process.env.NEXT_PUBLIC_APP_URL) {
//   throw new Error('NEXT_PUBLIC_APP_URL must be defined in your .env file');
// }

// const nextConfig = {
//   env: {
//     NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
//   },
//   devIndicators: {
//     buildActivity: true,
//   },
//   async headers() {
//     return [
//       {
//         source: '/:path*',
//         headers: [
//           {
//             key: 'Strict-Transport-Security',
//             value: 'max-age=63072000; includeSubDomains; preload'
//           },
//           {
//             key: 'Content-Security-Policy',
//             value: `upgrade-insecure-requests`
//           }
//         ],
//       },
//     ];
//   },
//   webpack: (config: WebpackConfig, { isServer }: { isServer: boolean }) => {
//     if (!isServer) {
//       config.resolve = {
//         ...config.resolve,
//         fallback: {
//           ...config.resolve?.fallback,
//           net: false,
//           tls: false,
//           fs: false,
//         }
//       };
//     }
//     return config;
//   },
// };

// module.exports = pwaConfig(nextConfig);
