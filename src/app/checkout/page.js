import Link from 'next/link';

import Navbar from '../../components/Navbar/Navbar';
import Footer from '../../components/Footer/Footer';
import styles from './checkout.module.css';

// Placeholder so the Checkout CTA from the cart/drawer is a real link, not a 404.
// The real checkout form, shipping quote, order creation and Paystack flow are
// Milestone 3.
export const metadata = {
  title: 'Checkout | Nankara',
  robots: { index: false },
};

export default function CheckoutPage() {
  return (
    <>
      <Navbar />
      <main id="checkout-main" className={styles.main}>
        <div className={styles.box}>
          <p className="section-label">Checkout</p>
          <h1 className={styles.title}>Checkout opens soon</h1>
          <p className={styles.body}>
            We&apos;re putting the finishing touches on secure payment. Your bag is
            saved — check back shortly.
          </p>
          <Link href="/cart" className="btn btn-dark" id="checkout-back-to-cart">
            Back to Bag
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
