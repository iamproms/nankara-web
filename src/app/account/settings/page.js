'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { useCustomerAuth } from '../../../hooks/useCustomerAuth';
import { changePassword, updateProfile } from '../../../lib/accountApi';
import { hasErrors, passwordChangeErrors } from '../../../lib/account';
import styles from '../account.module.css';

export default function AccountSettingsPage() {
  const { user, refresh, logout } = useCustomerAuth();
  const router = useRouter();

  const [profile, setProfile] = useState({
    first_name: user.first_name, last_name: user.last_name, phone: user.phone || '',
  });
  const [profileState, setProfileState] = useState('idle');

  const [pw, setPw] = useState({ current: '', next: '', confirm: '' });
  const [pwErrors, setPwErrors] = useState({});
  const [pwState, setPwState] = useState('idle');

  const saveProfile = async (e) => {
    e.preventDefault();
    setProfileState('saving');
    try {
      await updateProfile(profile);
      await refresh();
      setProfileState('saved');
    } catch {
      setProfileState('error');
    }
  };

  const savePw = async (e) => {
    e.preventDefault();
    const errs = passwordChangeErrors(pw);
    if (hasErrors(errs)) return setPwErrors(errs);
    setPwState('saving');
    try {
      await changePassword({ current_password: pw.current, new_password: pw.next });
      await logout();
      router.replace('/login');
    } catch (err) {
      setPwState('idle');
      setPwErrors({
        current: err?.status === 401 ? 'Current password is incorrect.' : 'Could not update.',
      });
    }
  };

  return (
    <>
      <h1 className={styles.heading}>Settings</h1>

      <p className={styles.subheading}>Profile</p>
      {profileState === 'saved' && <p className={`${styles.banner} ${styles.ok}`}>Saved.</p>}
      <form className={styles.form} onSubmit={saveProfile}>
        <div className={styles.grid2}>
          <div className={styles.field}>
            <label className={styles.label}>First name</label>
            <input className={styles.input} value={profile.first_name}
              onChange={(e) => setProfile((p) => ({ ...p, first_name: e.target.value }))} />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Last name</label>
            <input className={styles.input} value={profile.last_name}
              onChange={(e) => setProfile((p) => ({ ...p, last_name: e.target.value }))} />
          </div>
        </div>
        <div className={styles.field}>
          <label className={styles.label}>Phone / WhatsApp</label>
          <input className={styles.input} value={profile.phone}
            onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))} />
        </div>
        <div className={styles.field}>
          <label className={styles.label}>Email</label>
          <input className={styles.input} value={user.email} disabled />
        </div>
        <div className={styles.actions}>
          <button type="submit" className="btn btn-dark" disabled={profileState === 'saving'}>
            {profileState === 'saving' ? 'Saving…' : 'Save profile'}
          </button>
        </div>
      </form>

      <p className={styles.subheading}>Change password</p>
      <form className={styles.form} onSubmit={savePw}>
        <div className={styles.field}>
          <label className={styles.label}>Current password</label>
          <input type="password" className={styles.input} value={pw.current}
            onChange={(e) => setPw((v) => ({ ...v, current: e.target.value }))}
            autoComplete="current-password" />
          {pwErrors.current && <p className={styles.errorMsg}>{pwErrors.current}</p>}
        </div>
        <div className={styles.grid2}>
          <div className={styles.field}>
            <label className={styles.label}>New password</label>
            <input type="password" className={styles.input} value={pw.next}
              onChange={(e) => setPw((v) => ({ ...v, next: e.target.value }))}
              autoComplete="new-password" />
            {pwErrors.next && <p className={styles.errorMsg}>{pwErrors.next}</p>}
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Confirm</label>
            <input type="password" className={styles.input} value={pw.confirm}
              onChange={(e) => setPw((v) => ({ ...v, confirm: e.target.value }))}
              autoComplete="new-password" />
            {pwErrors.confirm && <p className={styles.errorMsg}>{pwErrors.confirm}</p>}
          </div>
        </div>
        <div className={styles.actions}>
          <button type="submit" className="btn btn-dark" disabled={pwState === 'saving'}>
            {pwState === 'saving' ? 'Saving…' : 'Change password'}
          </button>
        </div>
        <p className={styles.muted} style={{ fontSize: '0.78rem' }}>
          Changing your password signs you out on every device.
        </p>
      </form>
    </>
  );
}
