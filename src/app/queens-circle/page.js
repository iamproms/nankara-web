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

const benefits = [
  { num: '01', title: 'Early Access', body: 'See and shop new collections before they reach the public.' },
  { num: '02', title: 'Private Styling', body: 'One-on-one sessions with our styling team, in person or virtually.' },
  { num: '03', title: 'Members-Only Pieces', body: 'Limited runs and archive re-releases reserved exclusively for the Circle.' },
  { num: '04', title: 'Signature Gifting', body: 'Thoughtful gifts on your birthday and Circle anniversary, chosen with you in mind.' },
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
              style={{ objectFit: 'cover', objectPosition: 'center 15%' }}
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
              Queens Circle is Nankara&apos;s membership for our most valued clients: the women who return season after season. It is our way of saying thank you, and of keeping you closer to the brand than anyone else.
            </p>
          </ScrollReveal>
        </section>

        {/* Benefits */}
        <section className={styles.section} id="benefits">
          <ScrollReveal className={styles.inner}>
            <p className="section-label">Member Benefits</p>
            <h2 className={styles.sectionHeading}>
              What you receive<br />
              <em>as a Queen.</em>
            </h2>
            <div className={styles.benefitsGrid}>
              {benefits.map((b) => (
                <div key={b.num} className={styles.benefitCard}>
                  <span className={styles.benefitNum}>{b.num}</span>
                  <h3 className={styles.benefitTitle}>{b.title}</h3>
                  <p className={styles.benefitBody}>{b.body}</p>
                </div>
              ))}
            </div>
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
