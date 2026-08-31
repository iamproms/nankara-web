'use client';

import Navbar from '../../../components/Navbar/Navbar';
import Footer from '../../../components/Footer/Footer';
import styles from './status.module.css';

export default function ProductError({ reset }) {
  return (
    <>
      <Navbar />
      <main id="product-main" className={styles.main}>
        <div className={styles.box}>
          <p className="section-label">Shop</p>
          <h1 className={styles.title}>We couldn&apos;t load this piece</h1>
          <p className={styles.body}>Please try again in a moment.</p>
          <button
            type="button"
            className="btn btn-dark"
            id="product-error-retry"
            onClick={() => reset()}
          >
            Try again
          </button>
        </div>
      </main>
      <Footer />
    </>
  );
}
