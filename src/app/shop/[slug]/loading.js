import Navbar from '../../../components/Navbar/Navbar';
import Footer from '../../../components/Footer/Footer';
import styles from './loading.module.css';

export default function ProductLoading() {
  return (
    <>
      <Navbar />
      <main id="product-main" className={styles.main}>
        <div className={styles.detail}>
          <div className={styles.image} />
          <div className={styles.info}>
            <div className={`${styles.line} ${styles.short}`} />
            <div className={`${styles.line} ${styles.tall}`} />
            <div className={`${styles.line} ${styles.short}`} />
            <div className={styles.block} />
            <div className={styles.line} />
            <div className={styles.line} />
            <div className={styles.button} />
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
