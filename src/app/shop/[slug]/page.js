import { notFound } from 'next/navigation';
import Link from 'next/link';

import Navbar from '../../../components/Navbar/Navbar';
import Footer from '../../../components/Footer/Footer';
import ProductGallery from '../../../components/ProductGallery/ProductGallery';
import Price from '../../../components/Price/Price';
import MadeToMeasureNote from '../../../components/MadeToMeasureNote/MadeToMeasureNote';
import AddToBag from '../../../components/AddToBag/AddToBag';
import { getProduct } from '../../../lib/api';
import styles from './product.module.css';

// Server-rendered per request (like /shop) so admin publishes, price edits and
// stock changes appear on the storefront immediately. The catalogue is tiny and
// the API is fast; a CDN cache layer can come later (Milestone 5).
export const dynamic = 'force-dynamic';

function trimDescription(text, max = 155) {
  if (!text) return 'A made-to-measure Nankara piece from The Identity Collection.';
  const clean = text.replace(/\s+/g, ' ').trim();
  return clean.length > max ? `${clean.slice(0, max - 1).trimEnd()}…` : clean;
}

export async function generateMetadata({ params }) {
  try {
    const product = await getProduct(params.slug, { fresh: true });
    const description = trimDescription(product.description);
    const image = product.primary_image?.url;
    return {
      title: `${product.name} | Nankara`,
      description,
      alternates: { canonical: `/shop/${product.slug}` },
      openGraph: {
        title: `${product.name} | Nankara`,
        description,
        type: 'website',
        images: image ? [{ url: image }] : [],
      },
      twitter: {
        card: 'summary_large_image',
        title: `${product.name} | Nankara`,
        description,
        images: image ? [image] : [],
      },
    };
  } catch {
    return { title: 'Piece not found | Nankara' };
  }
}

export default async function ProductPage({ params }) {
  let product;
  try {
    product = await getProduct(params.slug, { fresh: true });
  } catch (err) {
    if (err?.status === 404) notFound();
    throw err;
  }

  const outOfStock = product.availability === 'OUT_OF_STOCK';
  const paragraphs = (product.description || '')
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: trimDescription(product.description, 5000),
    image: product.images?.map((img) => img.url) || [],
    category: product.category?.name,
    offers: {
      '@type': 'Offer',
      priceCurrency: 'NGN',
      price: product.price_ngn,
      availability: outOfStock
        ? 'https://schema.org/OutOfStock'
        : 'https://schema.org/InStock',
    },
  };

  return (
    <>
      <Navbar />
      <main id="product-main" className={styles.main}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <section className={styles.detail} id="product-detail">
          <div className={styles.galleryCol}>
            <ProductGallery images={product.images || []} productName={product.name} />
          </div>

          <div className={styles.infoCol}>
            <nav className={styles.breadcrumb} aria-label="Breadcrumb">
              <Link href="/shop">Shop</Link>
              {product.category && (
                <>
                  <span aria-hidden="true"> / </span>
                  <span>{product.category.name}</span>
                </>
              )}
            </nav>

            <h1 className={styles.name}>{product.name}</h1>
            <Price amountNgn={product.price_ngn} variant="detail" />

            <p className={`${styles.availability} ${outOfStock ? styles.availabilityOut : ''}`}>
              {outOfStock ? 'Out of Stock' : 'In Stock — made to your measurements'}
            </p>

            <MadeToMeasureNote className={styles.measure} />

            {paragraphs.length > 0 && (
              <div className={styles.description}>
                {paragraphs.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            )}

            <AddToBag product={product} />
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
