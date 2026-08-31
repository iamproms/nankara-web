import styles from './Badge.module.css';

// Small status pill for the admin surface. `tone` picks the colour:
// wait (amber) · go (green) · work (blue) · done (grey) · stop (red) · muted (light grey).
export default function Badge({ tone = 'muted', children }) {
  return (
    <span className={`${styles.badge} ${styles[tone] || styles.muted}`}>
      {children}
    </span>
  );
}
