import SmoothScroll from '../components/SmoothScroll/SmoothScroll';
import '../styles/globals.css';

export const metadata = {
  title: 'Clothie Dynasty — Luxury Women\'s Fashion',
  description: 'A luxury women\'s fashion brand crafted for women who dress intentionally, value quality, and lead with confidence.',
  keywords: 'Luxury Women\'s Fashion, Designer Dresses, Elegant Women\'s Clothing, Premium Fashion Brand',
  openGraph: {
    title: 'Clothie Dynasty',
    description: 'Where elegance meets purpose.',
    type: 'website',
    locale: 'en_US',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <SmoothScroll>
          {children}
        </SmoothScroll>
      </body>
    </html>
  );
}
