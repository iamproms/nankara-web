import Image from 'next/image';
import Link from 'next/link';
import Navbar from '../../components/Navbar/Navbar';
import Footer from '../../components/Footer/Footer';
import ScrollReveal from '../../components/ScrollReveal/ScrollReveal';
import styles from './about.module.css';

export const metadata = {
  title: 'About | Nankara',
  description: 'The story, mission, and values behind Nankara, a luxury women\'s fashion brand built for women who lead with confidence.',
};

const values = [
  { title: 'Individuality', body: 'We celebrate the woman who refuses to be defined by trends. Her style is her signature.' },
  { title: 'Purpose', body: 'Every collection has intention behind it. We ask why before we ask how.' },
  { title: 'Confidence', body: 'Our garments are built to amplify what is already within, not to create a costume.' },
  { title: 'Authenticity', body: 'We do not follow the industry. We follow the woman. The rest falls into place.' },
];

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <main id="about-main">

        {/* Hero */}
        <section className={styles.hero} id="about-hero">
          <div className={styles.heroImage}>
            <Image
              src="/images/nankara-12.jpg"
              alt="About the Nankara brand"
              fill
              sizes="100vw"
              style={{ objectFit: 'cover', objectPosition: 'center 55%', filter: 'var(--photo-tone)' }}
              priority
            />
            <div className={styles.heroOverlay} />
          </div>
          <div className={styles.heroContent}>
            <p className={styles.heroLabel}>About Nankara</p>
            <h1 className={styles.heroHeading}>
              A brand built on<br />
              the truth that<br />
              <em>elegance is earned,<br />
              never borrowed.</em>
            </h1>
          </div>
        </section>

        {/* Mission */}
        <section className={styles.section} id="mission">
          <ScrollReveal className={`${styles.inner} ${styles.innerNarrow} ${styles.textCenter}`}>
            <p className="section-label">Our Mission</p>
            <h2 className={styles.sectionHeading}>
              To create fashion that speaks<br />
              <em>before a word is said.</em>
            </h2>
            <p className={`${styles.body} ${styles.bodyCenter}`}>
              We design clothing that empowers women to walk into any room and be seen, not because they demand attention, but because their presence commands it naturally.
            </p>
          </ScrollReveal>
        </section>

        {/* Founder Story */}
        <section className={styles.founderSection} id="founder">
          <ScrollReveal className={styles.inner}>
            <div className={styles.founderContent}>
              <p className="section-label">The Founder</p>
              <h2 className={styles.sectionHeading}>
                Built for women who<br />
                <em>refuse to compromise.</em>
              </h2>
              <p className={`${styles.body} ${styles.dropCap}`}>
                Nankara was born from a personal frustration. As a woman navigating both corporate boardrooms and creative spaces, I found that the fashion industry often asked me to choose between elegance and power, between femininity and authority.
              </p>
              <p className={styles.body}>
                I didn&apos;t want to choose. I wanted garments that held the same complexity as the women wearing them. So, I built a brand that doesn&apos;t just make clothes, but crafts armor for the modern woman.
              </p>
              <div style={{ marginTop: 'var(--space-md)' }}>
                <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', color: 'var(--color-black)' }}>
                  <em>Founder, Nankara</em>
                </p>
              </div>
            </div>
            
            <div className={styles.founderImageWrap} style={{ position: 'relative' }}>
              <div className={styles.founderImage}>
                <Image
                  src="/images/nankara-13.jpg"
                  alt="Nankara Founder"
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  style={{ objectFit: 'cover', objectPosition: 'center 15%', filter: 'var(--photo-tone)' }}
                />
              </div>
              <div className={styles.founderImageAccent}>
                <Image
                  src="/images/nankara-01.jpg"
                  alt="Founder Accent"
                  fill
                  sizes="(max-width: 768px) 50vw, 25vw"
                  style={{ objectFit: 'cover', objectPosition: 'center top', filter: 'var(--photo-tone)' }}
                />
              </div>
            </div>
          </ScrollReveal>
        </section>

        {/* Values */}
        <section className={`${styles.valuesSection} ${styles.sectionDark} text-white`} id="values">
          <ScrollReveal className={styles.inner}>
            <div className={styles.valuesHeader}>
              <p className={`section-label ${styles.labelLight}`}>Core Values</p>
              <h2 className={`${styles.sectionHeading} ${styles.headingLight}`}>
                The pillars of<br />
                <em>who we are.</em>
              </h2>
            </div>
            <div className={styles.valuesGrid}>
              {values.map((v, i) => (
                <div key={i} className={styles.valueCard} style={{ color: 'var(--color-white)' }}>
                  <div className={styles.valueLine} style={{ background: 'var(--color-orange-mid)' }} />
                  <h3 className={styles.valueTitle}>{v.title}</h3>
                  <p className={styles.valueBody}>{v.body}</p>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </section>

        {/* Craftsmanship */}
        <section className={styles.craftSection} id="craftsmanship">
          <div className={styles.craftImage}>
            <Image
              src="/images/nankara-05.jpg"
              alt="Nankara craftsmanship and material quality"
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              style={{ objectFit: 'cover', objectPosition: 'center top', filter: 'var(--photo-tone)' }}
            />
          </div>
          <div className={styles.craftContent}>
            <p className="section-label">Craftsmanship</p>
            <h2 className={styles.sectionHeading}>
              Made carefully.<br />
              <em>Worn forever.</em>
            </h2>
            <p className={styles.body}>
              Our aesthetic is rooted in quiet luxury: clean lines, considered structure, and materials that reward closeness. Every seam is finished and every button chosen with intention, because Nankara garments are built to last, not just physically, but emotionally.
            </p>
          </div>
        </section>

        {/* Future Direction */}
        <section className={`${styles.section} ${styles.sectionOrange}`} id="future">
          <div className={`${styles.inner} ${styles.innerNarrow} ${styles.textCenter}`}>
            <p className={`section-label ${styles.labelCenter}`}>Looking Forward</p>
            <h2 className={styles.sectionHeading}>
              Nankara is<br />
              <em>just beginning.</em>
            </h2>
            <p className={`${styles.body} ${styles.bodyCenter}`}>
              We are expanding thoughtfully, but our core will never change: premium quality, emotional design, and a deep respect for the woman who chooses to wear us.
            </p>
            <div className={styles.futureCtas}>
              <Link href="/shop" className="btn btn-dark" id="about-shop-now">Shop the Current Collection</Link>
              <Link href="/contact" className="btn btn-orange" id="about-get-in-touch">Get in Touch</Link>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}
