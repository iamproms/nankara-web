'use client';

import { useState } from 'react';

import { useCart } from '../../hooks/useCart';
import QuantitySelector from '../QuantitySelector/QuantitySelector';
import styles from './AddToBag.module.css';

// Product-detail purchase control. Out-of-stock: the page stays viewable, the quantity
// selector is hidden and the button is disabled with clear messaging (spec §6, §22).
export default function AddToBag({ product }) {
  const { addItem, openDrawer } = useCart();
  const [qty, setQty] = useState(1);
  const outOfStock = product.availability === 'OUT_OF_STOCK';

  const handleAdd = () => {
    addItem(product.id, qty);
    openDrawer();
  };

  if (outOfStock) {
    return (
      <div className={styles.wrap}>
        <button
          type="button"
          className={`btn btn-dark ${styles.button}`}
          id="product-add-to-bag"
          disabled
        >
          Out of Stock
        </button>
        <p className={styles.note}>
          This piece is currently unavailable. Reach out via Contact to register your
          interest.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.row}>
        <QuantitySelector
          value={qty}
          onChange={setQty}
          idBase="product-quantity"
          label="Quantity"
        />
        <button
          type="button"
          className={`btn btn-dark ${styles.button}`}
          id="product-add-to-bag"
          onClick={handleAdd}
        >
          Add to Bag
        </button>
      </div>
    </div>
  );
}
