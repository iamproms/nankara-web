import SmoothScroll from '../components/SmoothScroll/SmoothScroll';
import CustomerAuthProvider from '../components/CustomerAuthProvider/CustomerAuthProvider';
import CartProvider from '../components/CartProvider/CartProvider';
import CartDrawer from '../components/CartDrawer/CartDrawer';
import '../styles/globals.css';

export const metadata = {
  title: 'Nankara | Luxury Women\'s Fashion',
  description: 'A luxury women\'s fashion brand crafted for women who dress intentionally, value quality, and lead with confidence.',
  keywords: 'Luxury Women\'s Fashion, Designer Dresses, Elegant Women\'s Clothing, Premium Fashion Brand',
  openGraph: {
    title: 'Nankara',
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
        <CustomerAuthProvider>
          <CartProvider>
            <SmoothScroll>
              {children}
              <CartDrawer />
            </SmoothScroll>
          </CartProvider>
        </CustomerAuthProvider>
      </body>
    </html>
  );
}
