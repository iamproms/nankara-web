'use client';

import styles from './QuantitySelector.module.css';

// −/value/+ stepper. Value is controlled; parent clamps via the cart reducer or its
// own state. `idBase` yields `${idBase}-decrement|-value|-increment`.
export default function QuantitySelector({
  value,
  onChange,
  min = 1,
  max = 99,
  idBase,
  size = 'md',
  label = 'Quantity',
}) {
  const decrement = () => onChange(Math.max(min, value - 1));
  const increment = () => onChange(Math.min(max, value + 1));

  return (
    <div
      className={`${styles.selector} ${styles[size] || ''}`}
      role="group"
      aria-label={label}
    >
      <button
        type="button"
        className={styles.btn}
        id={idBase ? `${idBase}-decrement` : undefined}
        onClick={decrement}
        disabled={value <= min}
        aria-label="Decrease quantity"
      >
        &minus;
      </button>
      <span
        className={styles.value}
        id={idBase ? `${idBase}-value` : undefined}
        aria-live="polite"
      >
        {value}
      </span>
      <button
        type="button"
        className={styles.btn}
        id={idBase ? `${idBase}-increment` : undefined}
        onClick={increment}
        disabled={value >= max}
        aria-label="Increase quantity"
      >
        +
      </button>
    </div>
  );
}
