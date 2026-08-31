// Pure helpers for the checkout flow — kept out of the components so they can be
// unit-tested. The backend is authoritative for money and availability; these only
// shape the request and catch obvious input mistakes before we send it.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Turn resolved-cart rows (from useResolvedCart) into the `items` array the
// POST /api/v1/orders endpoint expects. Every row is sent — the server is the
// single source of truth for availability and rejects the whole order (409) if
// any line can't be fulfilled (spec §28). The checkout page separately blocks
// submission when it already knows a row is unavailable.
export function buildOrderItems(rows) {
  return rows.map((row) => ({
    product_id: row.item.productId,
    quantity: row.item.quantity,
  }));
}

// True when the bag holds a row that can't be ordered as-is (deleted, unpublished
// or out of stock) — the checkout form is blocked until the shopper fixes it.
export function hasUnfulfillableRows(rows) {
  return rows.some((row) => row.unavailable || row.outOfStock);
}

export function buildOrderPayload(rows, { contact, delivery }) {
  return {
    contact: {
      first_name: contact.firstName.trim(),
      last_name: contact.lastName.trim(),
      email: contact.email.trim(),
      phone: contact.phone.trim(),
    },
    delivery: {
      country_code: delivery.countryCode,
      country_name: delivery.countryName,
      address_1: delivery.address1.trim(),
      address_2: delivery.address2.trim(),
      city: delivery.city.trim(),
      state_region: delivery.stateRegion.trim(),
      postal_code: delivery.postalCode.trim(),
      notes: delivery.notes.trim(),
    },
    items: buildOrderItems(rows),
  };
}

export function contactErrors(values) {
  const errors = {};
  if (!values.firstName.trim()) errors.firstName = 'Enter your first name.';
  if (!values.lastName.trim()) errors.lastName = 'Enter your last name.';
  if (!EMAIL_RE.test(values.email.trim())) errors.email = 'Enter a valid email address.';
  if (values.phone.trim().replace(/\D/g, '').length < 7) {
    errors.phone = 'Enter a valid phone or WhatsApp number.';
  }
  return errors;
}

export function deliveryErrors(values) {
  const errors = {};
  if (!values.countryCode) errors.countryCode = 'Select a country.';
  if (!values.address1.trim()) errors.address1 = 'Enter your address.';
  if (!values.city.trim()) errors.city = 'Enter your city.';
  if (!values.stateRegion.trim()) errors.stateRegion = 'Enter your state or region.';
  return errors;
}

export function hasErrors(...errorObjects) {
  return errorObjects.some((obj) => Object.keys(obj).length > 0);
}
