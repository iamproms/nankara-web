// Pure helpers for the customer-account flows — kept framework-free so they can
// be unit-tested. The backend is authoritative for everything; these shape
// requests and catch obvious input mistakes.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function loginErrors(values) {
  const errors = {};
  if (!EMAIL_RE.test((values.email || '').trim())) errors.email = 'Enter a valid email.';
  if (!values.password) errors.password = 'Enter your password.';
  return errors;
}

export function registerErrors(values) {
  const errors = {};
  if (!(values.firstName || '').trim()) errors.firstName = 'Enter your first name.';
  if (!(values.lastName || '').trim()) errors.lastName = 'Enter your last name.';
  if (!EMAIL_RE.test((values.email || '').trim())) errors.email = 'Enter a valid email.';
  if ((values.password || '').length < 8) {
    errors.password = 'Use at least 8 characters.';
  }
  return errors;
}

export function passwordChangeErrors(values) {
  const errors = {};
  if (!values.current) errors.current = 'Enter your current password.';
  if ((values.next || '').length < 8) errors.next = 'Use at least 8 characters.';
  if (values.next !== values.confirm) errors.confirm = 'The passwords don’t match.';
  return errors;
}

export function newPasswordErrors(values) {
  const errors = {};
  if ((values.next || '').length < 8) errors.next = 'Use at least 8 characters.';
  if (values.next !== values.confirm) errors.confirm = 'The passwords don’t match.';
  return errors;
}

export function addressErrors(values) {
  const errors = {};
  if (!(values.label || '').trim()) errors.label = 'Give this address a name.';
  if (!values.countryCode) errors.countryCode = 'Select a country.';
  if (!(values.address1 || '').trim()) errors.address1 = 'Enter the address.';
  if (!(values.city || '').trim()) errors.city = 'Enter the city.';
  if (!(values.stateRegion || '').trim()) errors.stateRegion = 'Enter the state or region.';
  return errors;
}

const MEASUREMENT_KEYS = [
  'bust_cm',
  'waist_cm',
  'hip_cm',
  'shoulder_cm',
  'sleeve_length_cm',
  'dress_length_cm',
  'height_cm',
];

export function measurementErrors(values) {
  const errors = {};
  for (const key of MEASUREMENT_KEYS) {
    const raw = values[key];
    if (raw === '' || raw === undefined || raw === null) continue;
    const n = Number(raw);
    if (!Number.isFinite(n) || n < 20 || n > 250) {
      errors[key] = 'Enter a value in cm (20–250).';
    }
  }
  return errors;
}

export function buildRegisterPayload(values) {
  return {
    email: values.email.trim(),
    password: values.password,
    first_name: values.firstName.trim(),
    last_name: values.lastName.trim(),
    phone: (values.phone || '').trim(),
  };
}

export function buildAddressPayload(values) {
  return {
    label: values.label.trim(),
    is_default: Boolean(values.isDefault),
    country_code: values.countryCode,
    country_name: values.countryName || '',
    address_1: values.address1.trim(),
    address_2: (values.address2 || '').trim(),
    city: values.city.trim(),
    state_region: values.stateRegion.trim(),
    postal_code: (values.postalCode || '').trim(),
    recipient_phone: (values.recipientPhone || '').trim(),
  };
}

export function buildMeasurementPayload(values) {
  const payload = { notes: (values.notes || '').trim() };
  for (const key of MEASUREMENT_KEYS) {
    const raw = values[key];
    payload[key] = raw === '' || raw === undefined || raw === null ? null : Number(raw);
  }
  return payload;
}

// The fulfilment journey a paid order moves through — index of the current step,
// or -1 before payment.
const JOURNEY = ['PAID', 'IN_PRODUCTION', 'READY', 'SHIPPED', 'DELIVERED'];

export function orderStatusStep(status) {
  return JOURNEY.indexOf(status);
}

export const ORDER_JOURNEY = ['Paid', 'In production', 'Ready', 'Shipped', 'Delivered'];

export function hasErrors(...objs) {
  return objs.some((o) => Object.keys(o).length > 0);
}
