import createNextIntlPlugin from 'next-intl/plugin';
// import withPWAInit from 'next-pwa';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');



/** @type {import('next').NextConfig} */
const nextConfig = {};

export default withNextIntl(nextConfig);

