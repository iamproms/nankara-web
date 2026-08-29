import Navbar from '../../components/Navbar/Navbar';
import Footer from '../../components/Footer/Footer';
import styles from './shop.module.css';

export default function ShopLoading() {
  return (
    <>
      <Navbar />
      <main id="shop-main" className={styles.main}>
        <section className={styles.intro} id="shop-intro">
          <p className="section-label">The Identity Collection #1</p>
          <h1 className={`editorial-heading ${styles.heading}`}>
            You haven&apos;t just found a piece of clothing, you&apos;ve discovered an{' '}
            <em>expression of your story</em>.
          </h1>
        </section>
        <section className={styles.catalogueSection}>
          <div className={styles.skeletonGrid} aria-hidden="true">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className={styles.skeletonCard}>
                <div className={styles.skeletonImage} />
                <div className={styles.skeletonLine} />
                <div className={styles.skeletonLine} />
              </div>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
