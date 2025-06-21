// next.config.js
module.exports = {
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8000',
      },
      {
        protocol: 'https',
        hostname: 'flashlab.pro', // Replace with your real domain (e.g., flashlab.pro)
      },
    ],
  },
}
