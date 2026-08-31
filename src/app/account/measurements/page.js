'use client';

import { useEffect, useState } from 'react';

import {
  buildMeasurementPayload,
  hasErrors,
  measurementErrors,
} from '../../../lib/account';
import { getMeasurements, saveMeasurements } from '../../../lib/accountApi';
import styles from '../account.module.css';

const FIELDS = [
  ['bust_cm', 'Bust'],
  ['waist_cm', 'Waist'],
  ['hip_cm', 'Hip'],
  ['shoulder_cm', 'Shoulder'],
  ['sleeve_length_cm', 'Sleeve length'],
  ['dress_length_cm', 'Dress length'],
  ['height_cm', 'Height'],
];

const EMPTY = Object.fromEntries([...FIELDS.map(([k]) => [k, '']), ['notes', '']]);

export default function MeasurementsPage() {
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [state, setState] = useState('loading'); // loading | ready | saved | error

  useEffect(() => {
    getMeasurements()
      .then((data) => {
        if (data) {
          setValues({
            ...EMPTY,
            ...Object.fromEntries(
              FIELDS.map(([k]) => [k, data[k] == null ? '' : String(data[k])])
            ),
            notes: data.notes || '',
          });
        }
        setState('ready');
      })
      .catch(() => setState('ready'));
  }, []);

  const set = (k) => (e) => {
    setValues((v) => ({ ...v, [k]: e.target.value }));
    setErrors((x) => ({ ...x, [k]: '' }));
  };

  const submit = async (e) => {
    e.preventDefault();
    const errs = measurementErrors(values);
    if (hasErrors(errs)) return setErrors(errs);
    setState('loading');
    try {
      await saveMeasurements(buildMeasurementPayload(values));
      setState('saved');
    } catch {
      setState('error');
    }
  };

  return (
    <>
      <h1 className={styles.heading}>Measurements</h1>
      <p className={styles.muted}>
        Share your measurements once (in cm). They’re used automatically for every
        made-to-measure order — you won’t need to send them again.
      </p>

      {state === 'saved' && <p className={`${styles.banner} ${styles.ok}`}>Saved.</p>}
      {state === 'error' && <p className={styles.banner}>Could not save — please try again.</p>}

      <form className={styles.form} onSubmit={submit} noValidate style={{ marginTop: '1.5rem' }}>
        <div className={styles.grid2}>
          {FIELDS.map(([key, label]) => (
            <div className={styles.field} key={key}>
              <label className={styles.label}>{label} (cm)</label>
              <input
                type="number"
                step="0.1"
                min="20"
                max="250"
                className={styles.input}
                value={values[key]}
                onChange={set(key)}
              />
              {errors[key] && <p className={styles.errorMsg}>{errors[key]}</p>}
            </div>
          ))}
        </div>
        <div className={styles.field}>
          <label className={styles.label}>Notes for the tailor (optional)</label>
          <textarea className={styles.textarea} rows={3} value={values.notes} onChange={set('notes')} />
        </div>
        <div className={styles.actions}>
          <button type="submit" className="btn btn-dark" disabled={state === 'loading'}>
            {state === 'loading' ? 'Saving…' : 'Save measurements'}
          </button>
        </div>
      </form>
    </>
  );
}
