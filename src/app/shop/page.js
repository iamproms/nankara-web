import Navbar from '../../components/Navbar/Navbar';
import Footer from '../../components/Footer/Footer';
import ShopCatalogue from '../../components/ShopCatalogue/ShopCatalogue';
import { getCategories, getProducts } from '../../lib/api';
import styles from './shop.module.css';

export const metadata = {
  title: 'Shop — The Identity Collection | Nankara',
  description:
    'The Identity Collection #1. Ankara pieces made to your fit, built around identities such as The Bold Statement Queen and The Quiet Power Queen.',
};

// Rendered per request (SSR) so the build doesn't depend on the backend being up and
// the catalogue is always current. The list is tiny (<10 items) and the API is fast.
export const dynamic = 'force-dynamic';

export default async function ShopPage() {
  const [products, categories] = await Promise.all([getProducts(), getCategories()]);

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

        <section className={styles.catalogueSection} id="shop-catalogue">
          <ShopCatalogue products={products} categories={categories} />
        </section>
      </main>
      <Footer />
    </>
  );
}
