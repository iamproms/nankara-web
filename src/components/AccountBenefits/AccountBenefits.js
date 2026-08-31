import styles from '../../styles/auth.module.css';

export const BENEFITS = [
  {
    title: 'Track every order',
    body: 'Follow each piece from payment through production to your door.',
  },
  {
    title: 'Faster checkout',
    body: 'Your contact and delivery details saved and pre-filled.',
  },
  {
    title: 'Saved address book',
    body: 'Home, work, a gift recipient — ship anywhere without re-typing.',
  },
  {
    title: 'Your measurement profile',
    body:
      'Share your measurements once; every future made-to-measure piece is cut ' +
      'to the same fit.',
  },
];

export default function AccountBenefits({ compact = false }) {
  const list = compact ? BENEFITS.slice(0, 3) : BENEFITS;
  return (
    <div className={compact ? undefined : styles.benefits}>
      <p className={styles.benefitsTitle}>With a Nankara account</p>
      {list.map((b) => (
        <div key={b.title} className={styles.benefit}>
          <h3>{b.title}</h3>
          {!compact && <p>{b.body}</p>}
        </div>
      ))}
    </div>
  );
}
