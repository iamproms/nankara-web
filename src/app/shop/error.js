'use client';

import Navbar from '../../components/Navbar/Navbar';
import Footer from '../../components/Footer/Footer';
import styles from './shop.module.css';

export default function ShopError({ reset }) {
  return (
    <>
      <Navbar />
      <main id="shop-main" className={styles.main}>
        <div className={styles.errorBox}>
          <p className="section-label">Shop</p>
          <h1 className={styles.errorTitle}>We couldn&apos;t load the collection</h1>
          <p className={styles.errorBody}>
            Something went wrong reaching our catalogue. Please try again in a moment.
          </p>
          <button
            type="button"
            className="btn btn-dark"
            id="shop-error-retry"
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
