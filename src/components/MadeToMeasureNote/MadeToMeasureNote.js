import styles from './MadeToMeasureNote.module.css';

// Spec §6 "Made for your fit" — shown on the product page before purchase, reused at
// checkout in Milestone 3.
export default function MadeToMeasureNote({ className = '' }) {
  return (
    <div className={`${styles.note} ${className}`} id="product-made-to-measure">
      <p className={styles.title}>Made for your fit</p>
      <p className={styles.body}>
        This Nankara piece will be tailored to you. After your order is confirmed, our
        team will contact you to collect the measurements required for your piece.
      </p>
    </div>
  );
}
