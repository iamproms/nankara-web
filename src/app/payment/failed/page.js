'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

import Navbar from '../../../components/Navbar/Navbar';
import Footer from '../../../components/Footer/Footer';
import styles from './failed.module.css';

function PaymentFailedContent() {
  const reference = useSearchParams().get('reference');

  return (
    <main id="payment-failed-main" className={styles.main}>
      <div className={styles.inner}>
        <p className="section-label">Payment not completed</p>
        <h1 className={styles.heading}>Your payment wasn&apos;t completed.</h1>
        <p className={styles.body}>
          Nothing has been charged and your bag is still saved
          {reference ? (
            <>
              {' '}
              under reference <strong>{reference}</strong>
            </>
          ) : null}
          . You can return to checkout and try again whenever you&apos;re ready.
        </p>
        <div className={styles.actions}>
          <Link href="/checkout" className="btn btn-dark">
            Return to checkout
          </Link>
          <Link href="/cart" className={styles.textLink}>
            View bag
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function PaymentFailedPage() {
  return (
    <>
      <Navbar />
      <Suspense fallback={<main className={styles.main} />}>
        <PaymentFailedContent />
      </Suspense>
      <Footer />
    </>
  );
}
