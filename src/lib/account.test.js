import { describe, expect, it } from 'vitest';

import {
  addressErrors,
  buildAddressPayload,
  buildMeasurementPayload,
  buildRegisterPayload,
  loginErrors,
  measurementErrors,
  newPasswordErrors,
  orderStatusStep,
  passwordChangeErrors,
  registerErrors,
} from './account';

describe('loginErrors / registerErrors', () => {
  it('flags a bad email and short password', () => {
    const e = registerErrors({ firstName: 'A', lastName: 'B', email: 'no', password: 'x' });
    expect(e.email).toBeTruthy();
    expect(e.password).toBeTruthy();
  });
  it('passes a good register form', () => {
    expect(
      registerErrors({
        firstName: 'Ada', lastName: 'Obi', email: 'a@b.com', password: 'longenough',
      })
    ).toEqual({});
  });
  it('login needs email + password', () => {
    expect(loginErrors({ email: '', password: '' })).toEqual({
      email: 'Enter a valid email.',
      password: 'Enter your password.',
    });
  });
});

describe('password errors', () => {
  it('change: mismatch + short', () => {
    const e = passwordChangeErrors({ current: 'x', next: 'short', confirm: 'other' });
    expect(e.next).toBeTruthy();
    expect(e.confirm).toBeTruthy();
  });
  it('new: match + length', () => {
    expect(newPasswordErrors({ next: 'longenough', confirm: 'longenough' })).toEqual({});
  });
});

describe('addressErrors', () => {
  it('requires the key fields', () => {
    expect(Object.keys(addressErrors({})).sort()).toEqual(
      ['address1', 'city', 'countryCode', 'label', 'stateRegion'].sort()
    );
  });
});

describe('measurementErrors', () => {
  it('ignores blanks, rejects absurd numbers', () => {
    expect(measurementErrors({ bust_cm: '', waist_cm: '74' })).toEqual({});
    expect(measurementErrors({ bust_cm: '999' }).bust_cm).toBeTruthy();
    expect(measurementErrors({ hip_cm: '2' }).hip_cm).toBeTruthy();
  });
});

describe('payload builders', () => {
  it('buildRegisterPayload trims + maps', () => {
    expect(
      buildRegisterPayload({
        email: ' a@b.com ', password: 'pw', firstName: ' Ada ', lastName: 'Obi', phone: '',
      })
    ).toEqual({
      email: 'a@b.com', password: 'pw', first_name: 'Ada', last_name: 'Obi', phone: '',
    });
  });
  it('buildAddressPayload maps camel → snake', () => {
    const p = buildAddressPayload({
      label: 'Home', countryCode: 'NG', countryName: 'Nigeria',
      address1: '1 Rd', city: 'Lagos', stateRegion: 'Lagos', isDefault: true,
    });
    expect(p.address_1).toBe('1 Rd');
    expect(p.is_default).toBe(true);
    expect(p.country_code).toBe('NG');
  });
  it('buildMeasurementPayload nulls blanks, numbers the rest', () => {
    const p = buildMeasurementPayload({ bust_cm: '91', waist_cm: '', notes: ' x ' });
    expect(p.bust_cm).toBe(91);
    expect(p.waist_cm).toBe(null);
    expect(p.notes).toBe('x');
  });
});

describe('orderStatusStep', () => {
  it('indexes the journey', () => {
    expect(orderStatusStep('PAID')).toBe(0);
    expect(orderStatusStep('SHIPPED')).toBe(3);
    expect(orderStatusStep('PENDING_PAYMENT')).toBe(-1);
  });
});
