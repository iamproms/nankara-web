import Link from 'next/link';

import Navbar from '../../../components/Navbar/Navbar';
import Footer from '../../../components/Footer/Footer';
import styles from './status.module.css';

export default function ProductNotFound() {
  return (
    <>
      <Navbar />
      <main id="product-main" className={styles.main}>
        <div className={styles.box}>
          <p className="section-label">Shop</p>
          <h1 className={styles.title}>This piece is no longer available</h1>
          <p className={styles.body}>
            It may have been unpublished or removed from the collection.
          </p>
          <Link href="/shop" className="btn btn-dark" id="product-not-found-back">
            Back to the Shop
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
