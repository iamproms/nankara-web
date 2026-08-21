'use client';
import { useState } from 'react';
import styles from './NewsletterSection.module.css';

export default function NewsletterSection() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | success | error

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setStatus('error');
      return;
    }
    setStatus('loading');
    // Mailchimp integration placeholder
    setTimeout(() => {
      setStatus('success');
      setEmail('');
    }, 1200);
  };

  return (
    <section className={styles.section} id="newsletter">
      <div className={styles.inner}>
        <div className={styles.content}>
          <p className={styles.preLabel}>The Edit</p>
          <h2 className={styles.heading}>
            Join the world of<br />
            <em>Clothie Dynasty.</em>
          </h2>
          <p className={styles.body}>
            Be first to discover new collections, editorial features, and exclusive access — delivered with the same elegance as the clothes themselves.
          </p>
        </div>
        <div className={styles.formWrap}>
          {status === 'success' ? (
            <div className={styles.success}>
              <span className={styles.successIcon}>✓</span>
              <p className={styles.successText}>You are now part of the Dynasty.</p>
              <p className={styles.successSub}>Watch your inbox for something beautiful.</p>
            </div>
          ) : (
            <form className={styles.form} onSubmit={handleSubmit} noValidate id="newsletter-form">
              <div className={styles.inputWrap}>
                <input
                  type="email"
                  id="newsletter-email"
                  name="email"
                  className={`${styles.input} ${status === 'error' ? styles.inputError : ''}`}
                  placeholder="Your email address"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setStatus('idle'); }}
                  aria-label="Email address for newsletter"
                  required
                />
                <button
                  type="submit"
                  className={styles.submitBtn}
                  disabled={status === 'loading'}
                  id="newsletter-submit"
                >
                  {status === 'loading' ? '...' : 'Join'}
                </button>
              </div>
              {status === 'error' && (
                <p className={styles.errorText} role="alert">Please enter a valid email address.</p>
              )}
              <p className={styles.privacy}>
                By subscribing you agree to receive our curated communications. No spam — ever.
              </p>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
