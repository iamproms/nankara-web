import Image from 'next/image';
import Link from 'next/link';
import Navbar from '../../components/Navbar/Navbar';
import Footer from '../../components/Footer/Footer';
import ScrollReveal from '../../components/ScrollReveal/ScrollReveal';
import styles from './about.module.css';

export const metadata = {
  title: 'About — Clothie Dynasty',
  description: 'The story, mission, and values behind Clothie Dynasty — a luxury women\'s fashion brand built for women who lead with confidence.',
};

const values = [
  { title: 'Individuality', body: 'We celebrate the woman who refuses to be defined by trends. Her style is her signature.' },
  { title: 'Purpose', body: 'Every collection has intention behind it. We ask why before we ask how.' },
  { title: 'Confidence', body: 'Our garments are built to amplify what is already within — not to create a costume.' },
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
              src="/images/277007a13070b1691976e3ff5a2d8f62.jpg"
              alt="Clothie Dynasty — About the brand"
              fill
              sizes="100vw"
              style={{ objectFit: 'cover', objectPosition: 'center 15%' }}
              priority
            />
            <div className={styles.heroOverlay} />
          </div>
          <div className={styles.heroContent}>
            <p className={styles.heroLabel}>About Clothie Dynasty</p>
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
          <ScrollReveal className={`${styles.inner} ${styles.innerNarrow}`}>
            <p className="section-label">Our Mission</p>
            <h2 className={styles.sectionHeading}>
              To create fashion that speaks<br />
              <em>before a word is said.</em>
            </h2>
            <p className={`${styles.body} ${styles.dropCap}`}>
              Our mission is to design clothing that empowers women to walk into any room — any room — and be seen, not because they demand attention, but because their presence commands it naturally. We achieve this through a relentless commitment to quality, beauty, and the belief that fashion is a form of self-expression that deserves to be taken seriously.
            </p>
          </ScrollReveal>
        </section>

        {/* Vision */}
        <section className={`${styles.section} ${styles.sectionDark}`} id="vision">
          <div className={`${styles.inner} ${styles.innerNarrow}`}>
            <p className={`section-label ${styles.labelLight}`}>Our Vision</p>
            <h2 className={`${styles.sectionHeading} ${styles.headingLight}`}>
              To become the fashion house<br />
              that<em> this generation of women</em><br />
              remembers as their own.
            </h2>
            <p className={`${styles.body} ${styles.bodyLight}`}>
              We are building toward a future where Clothie Dynasty is not simply a brand women wear — it is a brand women belong to. Where our name is spoken in the same breath as legacy. Where the women who wore us first say: &quot;We knew before the world did.&quot;
            </p>
          </div>
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
                Clothie Dynasty was born from a personal frustration. As a woman navigating both corporate boardrooms and creative spaces, I found that the fashion industry often asked me to choose between elegance and power, between femininity and authority.
              </p>
              <p className={styles.body}>
                I didn&apos;t want to choose. I wanted garments that held the same complexity as the women wearing them. So, I built a brand that doesn&apos;t just make clothes, but crafts armor for the modern woman.
              </p>
              <div style={{ marginTop: 'var(--space-md)' }}>
                <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', color: 'var(--color-charcoal)' }}>
                  <em>— Clothie Dynasty</em>
                </p>
              </div>
            </div>
            
            <div className={styles.founderImageWrap} style={{ position: 'relative' }}>
              <div className={styles.founderImage}>
                <Image
                  src="/images/4a207cc720306c5746f18995287a3e6a.jpg"
                  alt="Clothie Dynasty Founder"
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  style={{ objectFit: 'cover', objectPosition: 'center 15%' }}
                />
              </div>
              <div className={styles.founderImageAccent}>
                <Image
                  src="/images/0481794db27e2a26c0c9270a1390a116.jpg"
                  alt="Founder Accent"
                  fill
                  sizes="(max-width: 768px) 50vw, 25vw"
                  style={{ objectFit: 'cover', objectPosition: 'center top' }}
                />
              </div>
            </div>
          </ScrollReveal>
        </section>

        {/* Design Philosophy */}
        <section className={styles.section} id="philosophy">
          <div className={`${styles.inner} ${styles.innerNarrow}`}>
            <p className="section-label">Design Philosophy</p>
            <h2 className={styles.sectionHeading}>
              We design for<em> the moment</em><br />
              and for the lifetime.
            </h2>
            <p className={`${styles.body} ${styles.dropCap}`}>
              Every Clothie Dynasty piece is designed to exist beyond its season. We resist the tyranny of the trend cycle and instead ask: will this garment feel important five years from now? Will the woman who wears it remember how it made her feel? If the answer is yes — we make it.
            </p>
            <p className={styles.body}>
              Our aesthetic is rooted in quiet luxury — the kind that does not announce itself but is unmistakably present. Clean lines, considered structure, and materials that reward closeness. We believe in restraint as a form of sophistication.
            </p>
          </div>
        </section>

        {/* Values */}
        <section className={`${styles.valuesSection} ${styles.sectionDark} text-white`} id="values">
          <ScrollReveal className={styles.inner}>
            <div className={styles.valuesHeader}>
              <p className={`section-label ${styles.labelLight}`}>Core Values</p>
              <h2 className={`${styles.sectionHeading} ${styles.headingLight}`}>
                The pillars of<br />
                <em>our dynasty.</em>
              </h2>
            </div>
            <div className={styles.valuesGrid}>
              {values.map((v, i) => (
                <div key={i} className={styles.valueCard} style={{ color: 'var(--color-white)' }}>
                  <div className={styles.valueLine} style={{ background: 'var(--color-lavender-mid)' }} />
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
              src="/images/35a04a2a5c90122f1754f2b1198c7d6f.jpg"
              alt="Clothie Dynasty craftsmanship and material quality"
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              style={{ objectFit: 'cover', objectPosition: 'center' }}
            />
          </div>
          <div className={styles.craftContent}>
            <p className="section-label">Craftsmanship</p>
            <h2 className={styles.sectionHeading}>
              Made carefully.<br />
              <em>Worn forever.</em>
            </h2>
            <p className={styles.body}>
              We partner with skilled artisans who share our values. Every seam is finished. Every lining is considered. Every button is chosen with intention. We believe the interior of a garment reveals the integrity of the brand that made it.
            </p>
            <p className={styles.body}>
              Clothie Dynasty garments are built to last — not just physically, but emotionally. The kind of pieces that get passed down. That carry memory. That become part of the story.
            </p>
          </div>
        </section>

        {/* Future Direction */}
        <section className={`${styles.section} ${styles.sectionLavender}`} id="future">
          <div className={`${styles.inner} ${styles.innerNarrow} ${styles.textCenter}`}>
            <p className={`section-label ${styles.labelCenter}`}>Looking Forward</p>
            <h2 className={styles.sectionHeading}>
              The dynasty is<br />
              <em>just beginning.</em>
            </h2>
            <p className={`${styles.body} ${styles.bodyCenter}`}>
              We are expanding thoughtfully — new collections, new categories, and new ways to bring the Clothie Dynasty experience to more women around the world. But our core will never change: premium quality, emotional design, and a deep respect for the woman who chooses to wear us.
            </p>
            <div className={styles.futureCtas}>
              <Link href="/store" className="btn btn-dark" id="about-shop-now">Shop the Current Collection</Link>
              <Link href="/contact" className="btn btn-lavender" id="about-get-in-touch">Get in Touch</Link>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}
