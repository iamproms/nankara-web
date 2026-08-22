import Image from 'next/image';
import Link from 'next/link';
import Navbar from '../../components/Navbar/Navbar';
import Footer from '../../components/Footer/Footer';
import ScrollReveal from '../../components/ScrollReveal/ScrollReveal';
import styles from './nankara-silhouette.module.css';

export const metadata = {
  title: 'Nankara Silhouette | Nankara',
  description: 'Nankara Silhouette is our signature line: the pieces that define the shape of the brand, built around structure, restraint, and the woman who wears them.',
};

const pieces = [
  {
    id: 'the-line',
    title: 'The Line',
    subtitle: 'Signature Silhouette',
    image: '/images/1e7204cbacd7d8aa19636470d1857c85.jpg',
  },
  {
    id: 'the-structure',
    title: 'The Structure',
    subtitle: 'Tailored Edit',
    image: '/images/260975f13f8e0b7639005c2b230c799a.jpg',
  },
  {
    id: 'the-form',
    title: 'The Form',
    subtitle: 'Draped Edit',
    image: '/images/347b9487d84b8b0afee9359ae46d3603.jpg',
  },
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
              src="/images/9b6153bcde944c6cb838426e066ec8cc.jpg"
              alt="Nankara Silhouette signature collection"
              fill
              sizes="100vw"
              style={{ objectFit: 'cover', objectPosition: 'center 15%' }}
              priority
            />
            <div className={styles.heroOverlay} />
          </div>
          <div className={styles.heroContent}>
            <p className={styles.heroLabel}>Nankara Silhouette</p>
            <h1 className={styles.heroHeading}>
              The shape<br />
              <em>we were built on.</em>
            </h1>
          </div>
        </section>

        {/* Intro */}
        <section className={styles.section} id="intro">
          <ScrollReveal className={`${styles.inner} ${styles.innerNarrow} ${styles.textCenter}`}>
            <p className={`section-label ${styles.labelCenter}`}>The Signature Line</p>
            <h2 className={styles.sectionHeading}>
              Every brand has a shape.<br />
              <em>This one is ours.</em>
            </h2>
            <p className={`${styles.body} ${styles.bodyCenter}`}>
              Nankara Silhouette is our founding collection: the pieces that define how we cut, structure, and drape. Where every other collection borrows a season, this one is permanent.
            </p>
          </ScrollReveal>
        </section>

        {/* Pieces */}
        <section className={styles.piecesSection} id="pieces">
          <ScrollReveal className={styles.inner}>
            <p className="section-label">The Pieces</p>
            <h2 className={styles.sectionHeading}>
              Three forms.<br />
              <em>One silhouette.</em>
            </h2>
            <div className={styles.grid}>
              {pieces.map((p, i) => (
                <div key={p.id} className={`${styles.card} ${i === 0 ? styles.cardLarge : ''}`} id={`silhouette-card-${p.id}`}>
                  <div className={styles.imageWrap}>
                    <Image
                      src={p.image}
                      alt={`${p.title}: ${p.subtitle}`}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      style={{ objectFit: 'cover', objectPosition: 'center 15%' }}
                    />
                  </div>
                  <div className={styles.cardOverlay} />
                  <div className={styles.cardContent}>
                    <p className={styles.cardSubtitle}>{p.subtitle}</p>
                    <h3 className={styles.cardTitle}>{p.title}</h3>
                  </div>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </section>

        {/* Fit Philosophy */}
        <section className={styles.fitSection} id="fit-philosophy">
          <div className={styles.fitImage}>
            <Image
              src="/images/4f93702c791decbe30d156e56b2d2368.jpg"
              alt="Nankara Silhouette fit and structure"
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              style={{ objectFit: 'cover', objectPosition: 'center' }}
            />
          </div>
          <div className={styles.fitContent}>
            <p className="section-label">Fit Philosophy</p>
            <h2 className={styles.sectionHeading}>
              Built around the body.<br />
              <em>Not the trend.</em>
            </h2>
            <p className={styles.body}>
              The Silhouette line is designed first around structure: where a seam sits, how a shoulder falls, the way fabric moves with you rather than around you. Every piece in this collection is refined across multiple fittings before it ever reaches you.
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
