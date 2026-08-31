import Image from 'next/image';
import Link from 'next/link';
import Navbar from '../../components/Navbar/Navbar';
import Footer from '../../components/Footer/Footer';
import ScrollReveal from '../../components/ScrollReveal/ScrollReveal';
import styles from './nankara-silhouette.module.css';

export const metadata = {
  title: 'Nankara Silhouette Guide | Nankara',
  description: 'The Nankara Silhouette Guide helps you identify your natural body shape, so every fit and every recommendation works with your body, not against it.',
};

const bodyTypes = [
  { id: 'hourglass', title: 'Hourglass', image: '/images/silhouette-guide/hourglass.png' },
  { id: 'inverted-triangle', title: 'Inverted Triangle', image: '/images/silhouette-guide/inverted-triangle.png' },
  { id: 'rectangle', title: 'Rectangular', image: '/images/silhouette-guide/rectangle.png' },
  { id: 'pear', title: 'Pear', image: '/images/silhouette-guide/pear.png' },
  { id: 'apple', title: 'Apple', image: null },
];

export default function NankaraSilhouettePage() {
  return (
    <>
      <Navbar />
      <main id="silhouette-main">

        {/* Hero */}
        <section className={styles.hero} id="silhouette-hero">
          <div className={styles.heroImage}>
            <Image
              src="/images/nankara-14.jpg"
              alt="Nankara Silhouette signature collection"
              fill
              sizes="100vw"
              style={{ objectFit: 'cover', objectPosition: 'center 15%', filter: 'var(--photo-tone)' }}
              priority
            />
            <div className={styles.heroOverlay} />
          </div>
          <div className={styles.heroContent}>
            <p className={styles.heroLabel}>Nankara Silhouette Guide</p>
            <h1 className={styles.heroHeading}>
              The shape<br />
              <em>we were built on.</em>
            </h1>
          </div>
        </section>

        {/* Intro */}
        <section className={styles.section} id="intro">
          <ScrollReveal className={`${styles.inner} ${styles.innerNarrow} ${styles.textCenter}`}>
            <p className={`section-label ${styles.labelCenter}`}>Body Types</p>
            <h2 className={styles.sectionHeading}>
              Know your shape.<br />
              <em>Dress with intention.</em>
            </h2>
            <p className={`${styles.body} ${styles.bodyCenter}`}>
              Every woman&apos;s body tells a different story. The Nankara Silhouette Guide helps you understand your natural shape, so every fit we create works with your body, not against it.
            </p>
          </ScrollReveal>
        </section>

        {/* Body Types */}
        <section className={styles.piecesSection} id="body-types">
          <ScrollReveal className={styles.inner}>
            <p className="section-label">Find Your Shape</p>
            <h2 className={styles.sectionHeading}>
              Five shapes.<br />
              <em>One silhouette guide.</em>
            </h2>
            <div className={styles.typeGrid}>
              {bodyTypes.map((t) => (
                <div key={t.id} className={styles.typeCard} id={`silhouette-type-${t.id}`}>
                  <div className={styles.typeImageWrap}>
                    {t.image ? (
                      <Image
                        src={t.image}
                        alt={`${t.title} body type silhouette`}
                        fill
                        sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 20vw"
                        className={styles.typeImage}
                      />
                    ) : (
                      <span className={styles.typeImageEmpty}>Guide coming soon</span>
                    )}
                  </div>
                  <h3 className={styles.typeTitle}>{t.title}</h3>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </section>

        {/* Fit Philosophy */}
        <section className={styles.fitSection} id="fit-philosophy">
          <div className={styles.fitImage}>
            <Image
              src="/images/nankara-09.jpg"
              alt="Nankara Silhouette fit and structure"
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              style={{ objectFit: 'cover', objectPosition: 'center top', filter: 'var(--photo-tone)' }}
            />
          </div>
          <div className={styles.fitContent}>
            <p className="section-label">Fit Philosophy</p>
            <h2 className={styles.sectionHeading}>
              Built around the body.<br />
              <em>Not the trend.</em>
            </h2>
            <p className={styles.body}>
              Every Nankara piece is designed first around structure: where a seam sits, how a shoulder falls, the way fabric moves with you rather than around you. Knowing your silhouette is the first step toward a fit that feels made for you.
            </p>
          </div>
        </section>

        {/* CTA */}
        <section className={styles.section} id="silhouette-cta">
          <div className={`${styles.inner} ${styles.innerNarrow} ${styles.textCenter}`}>
            <p className={`section-label ${styles.labelCenter}`}>Shop the Line</p>
            <h2 className={styles.sectionHeading}>
              Find your<br />
              <em>silhouette.</em>
            </h2>
            <div className={styles.ctas}>
              <Link href="/shop" className="btn btn-dark" id="silhouette-shop-now">Shop the Collection</Link>
              <Link href="/queens-circle" className="btn btn-orange" id="silhouette-queens-circle">Explore Queens Circle</Link>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}
