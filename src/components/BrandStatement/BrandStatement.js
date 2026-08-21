'use client';
import { useScrollReveal } from '../../hooks/useScrollReveal';
import styles from './BrandStatement.module.css';

export default function BrandStatement() {
  const [revealRef, isVisible] = useScrollReveal();

  return (
    <section className={styles.section} id="brand-statement">
      <div className={`${styles.inner} ${isVisible ? 'reveal-visible' : 'reveal-hidden'}`} ref={revealRef}>
        <p className={`section-label ${styles.label}`}>Our Belief</p>
        <blockquote className={styles.quote}>
          <span className={styles.quoteMark}>&ldquo;</span>
          Fashion is not what you wear.<br />
          It is<em> who you are</em> — made visible.
          <span className={styles.quoteMark}>&rdquo;</span>
        </blockquote>
        <div className={styles.supporting}>
          <div className={styles.divLine} />
          <p className={styles.body}>
            At Clothie Dynasty, every piece is a declaration. We create for the woman who knows that how she dresses shapes how she moves through the world — with purpose, with grace, with an unshakeable sense of self.
          </p>
        </div>
      </div>
    </section>
  );
}
