'use client';

import { useEffect, useMemo, useState } from 'react';

import { countryName, listCountries } from '../../../lib/countries';
import { NIGERIA_STATES } from '../../../lib/nigeriaStates';
import { addressErrors, buildAddressPayload, hasErrors } from '../../../lib/account';
import {
  createAddress,
  deleteAddress,
  getAddresses,
  updateAddress,
} from '../../../lib/accountApi';
import styles from '../account.module.css';

const EMPTY = {
  label: '', countryCode: '', address1: '', address2: '', city: '',
  stateRegion: '', postalCode: '', recipientPhone: '', isDefault: false,
};

function toForm(a) {
  return {
    label: a.label, countryCode: a.country_code, address1: a.address_1,
    address2: a.address_2, city: a.city, stateRegion: a.state_region,
    postalCode: a.postal_code, recipientPhone: a.recipient_phone,
    isDefault: a.is_default,
  };
}

export default function AddressesPage() {
  const countries = useMemo(() => listCountries(), []);
  const [list, setList] = useState(null);
  const [editing, setEditing] = useState(null); // null | 'new' | id
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  const load = () => getAddresses().then(setList).catch(() => setList([]));
  useEffect(() => { load(); }, []);

  const openNew = () => { setValues(EMPTY); setErrors({}); setEditing('new'); };
  const openEdit = (a) => { setValues(toForm(a)); setErrors({}); setEditing(a.id); };
  const close = () => setEditing(null);

  const set = (k) => (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setValues((v) => (k === 'countryCode' ? { ...v, countryCode: val, stateRegion: '' } : { ...v, [k]: val }));
    setErrors((x) => ({ ...x, [k]: '' }));
  };

  const save = async (e) => {
    e.preventDefault();
    const errs = addressErrors(values);
    if (hasErrors(errs)) return setErrors(errs);
    setBusy(true);
    const payload = buildAddressPayload({
      ...values, countryName: countryName(values.countryCode),
    });
    try {
      if (editing === 'new') await createAddress(payload);
      else await updateAddress(editing, payload);
      await load();
      close();
    } catch {
      setErrors({ label: 'Could not save. Please try again.' });
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id) => {
    await deleteAddress(id);
    load();
  };

  const isNG = values.countryCode === 'NG';

  return (
    <>
      <h1 className={styles.heading}>Addresses</h1>

      {list === null && <p className={styles.muted}>Loading…</p>}
      {list && list.length === 0 && !editing && (
        <p className={styles.muted}>No saved addresses yet.</p>
      )}

      {list && list.map((a) => (
        <div key={a.id} className={`${styles.addressCard} ${a.is_default ? styles.default : ''}`}>
          <strong>{a.label}</strong>{a.is_default ? ' · Default' : ''}<br />
          {a.address_1}{a.address_2 ? `, ${a.address_2}` : ''}<br />
          {a.city}, {a.state_region}, {a.country_name}
          <div className={styles.addressActions}>
            <button type="button" className={styles.linkBtn} onClick={() => openEdit(a)}>Edit</button>
            <button type="button" className={styles.linkBtn} onClick={() => remove(a.id)}>Remove</button>
          </div>
        </div>
      ))}

      {editing ? (
        <form className={styles.form} onSubmit={save} noValidate>
          <p className={styles.subheading}>{editing === 'new' ? 'New address' : 'Edit address'}</p>
          <div className={styles.field}>
            <label className={styles.label}>Name (e.g. Home)</label>
            <input className={styles.input} value={values.label} onChange={set('label')} />
            {errors.label && <p className={styles.errorMsg}>{errors.label}</p>}
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Country</label>
            <select className={styles.select} value={values.countryCode} onChange={set('countryCode')}>
              <option value="">Select a country…</option>
              {countries.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
            </select>
            {errors.countryCode && <p className={styles.errorMsg}>{errors.countryCode}</p>}
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Address line 1</label>
            <input className={styles.input} value={values.address1} onChange={set('address1')} />
            {errors.address1 && <p className={styles.errorMsg}>{errors.address1}</p>}
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Address line 2 (optional)</label>
            <input className={styles.input} value={values.address2} onChange={set('address2')} />
          </div>
          <div className={styles.grid2}>
            <div className={styles.field}>
              <label className={styles.label}>City</label>
              <input className={styles.input} value={values.city} onChange={set('city')} />
              {errors.city && <p className={styles.errorMsg}>{errors.city}</p>}
            </div>
            <div className={styles.field}>
              <label className={styles.label}>State / Region</label>
              {isNG ? (
                <select className={styles.select} value={values.stateRegion} onChange={set('stateRegion')}>
                  <option value="">Select…</option>
                  {NIGERIA_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              ) : (
                <input className={styles.input} value={values.stateRegion} onChange={set('stateRegion')} />
              )}
              {errors.stateRegion && <p className={styles.errorMsg}>{errors.stateRegion}</p>}
            </div>
          </div>
          <label className={styles.label} style={{ display: 'flex', gap: '0.5rem', textTransform: 'none' }}>
            <input type="checkbox" checked={values.isDefault} onChange={set('isDefault')} />
            Make this my default address
          </label>
          <div className={styles.actions}>
            <button type="submit" className="btn btn-dark" disabled={busy}>
              {busy ? 'Saving…' : 'Save address'}
            </button>
            <button type="button" className={styles.linkBtn} onClick={close}>Cancel</button>
          </div>
        </form>
      ) : (
        <button type="button" className="btn btn-dark" onClick={openNew} style={{ marginTop: '1rem' }}>
          ＋ Add address
        </button>
      )}
    </>
  );
}
