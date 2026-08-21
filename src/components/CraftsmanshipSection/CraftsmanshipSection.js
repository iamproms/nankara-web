import styles from './CraftsmanshipSection.module.css';

const pillars = [
  {
    icon: '✦',
    title: 'Premium Fabrics',
    body: 'We source only the finest silks, crepes, and satins — materials that move with you, not against you. Every fabric is chosen for how it feels as much as how it looks.',
  },
  {
    icon: '◈',
    title: 'Considered Construction',
    body: 'Each garment is constructed with architectural precision. Our cuts are deliberate, our seams are finished to last, and our structure creates silhouettes that are both timeless and modern.',
  },
  {
    icon: '◇',
    title: 'Intentional Detail',
    body: 'The details are where Clothie Dynasty lives. A subtly turned hem. A perfectly placed dart. Hidden structure that gives confidence. Beauty that reveals itself slowly.',
  },
  {
    icon: '◉',
    title: 'Limited Production',
    body: 'We do not mass-produce. Each collection is produced in small, considered runs — ensuring quality is never sacrificed and each piece retains its exclusivity.',
  },
];

export default function CraftsmanshipSection() {
  return (
    <section className={styles.section} id="craftsmanship">
      <div className={styles.inner}>
        <div className={styles.textHeader}>
          <p className="section-label">The Making</p>
          <h2 className={styles.heading}>
            Craftsmanship is not a feature.<br />
            <em>It is our standard.</em>
          </h2>
          <p className={styles.subtitle}>
            Every Clothie Dynasty piece begins as an idea and becomes a garment through a process that respects time, material, and the woman who will wear it.
          </p>
        </div>

        <div className={styles.pillars}>
          {pillars.map((p) => (
            <div key={p.title} className={styles.pillar}>
              <span className={styles.icon} aria-hidden="true">{p.icon}</span>
              <h3 className={styles.pillarTitle}>{p.title}</h3>
              <p className={styles.pillarBody}>{p.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
