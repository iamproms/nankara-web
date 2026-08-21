'use client';
import Image from 'next/image';
import { useScrollReveal } from '../../hooks/useScrollReveal';
import styles from './TheWomanWeDesignFor.module.css';

const traits = [
  { number: '01', title: 'Dresses Intentionally', body: 'She chooses each piece with purpose. Every outfit is a deliberate statement of who she is today.' },
  { number: '02', title: 'Values Quality Over Trends', body: 'She invests in pieces that endure beyond seasons — crafted with care, worn with confidence for years.' },
  { number: '03', title: 'Leads with Confidence', body: 'She walks into every room as though she belongs there. Her clothing amplifies what she already knows.' },
  { number: '04', title: 'Appreciates Beauty & Meaning', body: 'She sees fashion as art. She is drawn to the story behind the stitch, the intention behind the cut.' },
];

export default function TheWomanWeDesignFor() {
  const [revealRef, isVisible] = useScrollReveal();

  return (
    <section className={`${styles.section} ${isVisible ? 'reveal-visible' : 'reveal-hidden'}`} id="the-woman" ref={revealRef}>
      <div className={styles.photoSide}>
        <Image
          src="/images/ab113bab993dbd7c4ee2f40b9dfc9802.jpg"
          alt="The Clothie Dynasty woman — confident, elegant, intentional"
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          style={{ objectFit: 'cover', objectPosition: 'center 15%' }}
          priority
        />
        <div className={styles.photoOverlay} />
        <div className={styles.photoLabel}>
          <p className={styles.photoLabelText}>The Woman</p>
          <p className={styles.photoLabelText}>We Design For</p>
        </div>
      </div>

      <div className={styles.contentSide}>
        <p className="section-label">Our Muse</p>
        <h2 className={styles.heading}>
          She is not a type.<br />
          She is a <em>force.</em>
        </h2>
        <p className={styles.intro}>
          Clothie Dynasty exists for the woman who knows that elegance is not about following rules — it is about setting them. She is the professional who closes deals in silk. The creative who paints her world in texture and form. The leader who speaks before she opens her mouth.
        </p>
        <div className={styles.traits}>
          {traits.map((t) => (
            <div key={t.number} className={styles.trait}>
              <span className={styles.traitNum}>{t.number}</span>
              <div>
                <h3 className={styles.traitTitle}>{t.title}</h3>
                <p className={styles.traitBody}>{t.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
