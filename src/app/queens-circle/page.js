import Image from 'next/image';
import Link from 'next/link';
import Navbar from '../../components/Navbar/Navbar';
import Footer from '../../components/Footer/Footer';
import ScrollReveal from '../../components/ScrollReveal/ScrollReveal';
import styles from './queens-circle.module.css';

export const metadata = {
  title: 'Queens Circle | Nankara',
  description: 'Queens Circle is Nankara\'s private membership for the women who wear us first: early access, private styling, and a seat at the table.',
};

const tiers = [
  {
    name: 'Muse',
    body: 'Your entry into the Circle. Early access to new collections, members-only updates, and a direct line to our styling team.',
  },
  {
    name: 'Confidante',
    body: 'For our returning Queens. Priority access to limited pieces, private trunk previews, and invitations to Nankara events.',
  },
  {
    name: 'Sovereign',
    body: 'Our highest honor. A dedicated stylist, first access to every release, and bespoke pieces made to your exact measure.',
  },
];

export default function QueensCirclePage() {
  return (
    <>
      <Navbar />
      <main id="queens-circle-main">

        {/* Hero */}
        <section className={styles.hero} id="queens-circle-hero">
          <div className={styles.heroImage}>
            <Image
              src="/images/3c6444ef3bc0352765233d1d7cdafabe.jpg"
              alt="Nankara Queens Circle"
              fill
              sizes="100vw"
              style={{ objectFit: 'cover', objectPosition: 'center 15%', filter: 'var(--photo-tone)' }}
              priority
            />
            <div className={styles.heroOverlay} />
          </div>
          <div className={styles.heroContent}>
            <p className={styles.heroLabel}>Queens Circle</p>
            <h1 className={styles.heroHeading}>
              An invitation,<br />
              <em>not a transaction.</em>
            </h1>
          </div>
        </section>

        {/* Intro */}
        <section className={styles.section} id="intro">
          <ScrollReveal className={`${styles.inner} ${styles.innerNarrow} ${styles.textCenter}`}>
            <p className={`section-label ${styles.labelCenter}`}>What It Is</p>
            <h2 className={styles.sectionHeading}>
              A private circle for the<br />
              <em>women who wear us first.</em>
            </h2>
            <p className={`${styles.body} ${styles.bodyCenter}`}>
              Queens Circle is Nankara&apos;s membership for our most valued clients: early access, private styling, and members-only pieces for the women who return season after season.
            </p>
          </ScrollReveal>
        </section>

        {/* Tiers */}
        <section className={`${styles.section} ${styles.sectionDark}`} id="tiers">
          <ScrollReveal className={styles.inner}>
            <div className={styles.tiersHeader}>
              <p className={`section-label ${styles.labelLight}`}>Circle Tiers</p>
              <h2 className={`${styles.sectionHeading} ${styles.headingLight}`}>
                Three levels.<br />
                <em>One sisterhood.</em>
              </h2>
            </div>
            <div className={styles.tiersGrid}>
              {tiers.map((t) => (
                <div key={t.name} className={styles.tierCard}>
                  <div className={styles.tierLine} />
                  <h3 className={styles.tierName}>{t.name}</h3>
                  <p className={styles.tierBody}>{t.body}</p>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </section>

        {/* CTA */}
        <section className={styles.ctaSection} id="join">
          <div className={`${styles.inner} ${styles.innerNarrow} ${styles.textCenter}`}>
            <p className={`section-label ${styles.labelCenter}`}>Join Us</p>
            <h2 className={styles.sectionHeading}>
              Your seat at the table<br />
              <em>is waiting.</em>
            </h2>
            <p className={`${styles.body} ${styles.bodyCenter}`}>
              Membership is by invitation and by request. Reach out to our concierge team to begin.
            </p>
            <div className={styles.ctas}>
              <Link href="/contact" className="btn btn-dark" id="queens-circle-request">Request an Invitation</Link>
              <Link href="/shop" className="btn btn-orange" id="queens-circle-shop">Shop the Collection</Link>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}
