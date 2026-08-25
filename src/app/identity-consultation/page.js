'use client';
import { useState } from 'react';
import Image from 'next/image';
import Navbar from '../../components/Navbar/Navbar';
import Footer from '../../components/Footer/Footer';
import ScrollReveal from '../../components/ScrollReveal/ScrollReveal';
import styles from './identity-consultation.module.css';

export default function IdentityConsultationPage() {
  const [stage, setStage] = useState('pitch'); // pitch -> price -> form -> success
  const [form, setForm] = useState({ name: '', email: '', country: '', goal: '', whatsapp: '' });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle');

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Please enter your full name.';
    if (!form.email.includes('@')) e.email = 'Please enter a valid email.';
    if (!form.country.trim()) e.country = 'Please enter your country of residence.';
    if (!form.goal.trim()) e.goal = 'Please share what you look forward to achieving.';
    if (!form.whatsapp.trim()) e.whatsapp = 'Please enter a WhatsApp number.';
    return e;
  };

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (errors[e.target.name]) setErrors((prev) => ({ ...prev, [e.target.name]: '' }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setStatus('loading');
    setTimeout(() => {
      setStatus('success');
      setStage('success');
    }, 1500);
  };

  return (
    <>
      <Navbar />
      <main id="identity-consultation-main">

        {/* Hero */}
        <section className={styles.pageHeader}>
          <div className={styles.heroImage}>
            <Image
              src="/images/nankara-03.jpg"
              alt="Nankara Identity Consultation"
              fill
              sizes="100vw"
              style={{ objectFit: 'cover', objectPosition: 'center 20%', filter: 'var(--photo-tone)' }}
              priority
            />
            <div className={styles.heroOverlay} />
          </div>
          <div className={styles.headerInner}>
            <p className={styles.headerLabel}>Identity Consultation</p>
            <h1 className={styles.headerHeading}>
              Made for you.<br />
              <em>Made with intention.</em>
            </h1>
          </div>
        </section>

        {/* Main */}
        <section className={styles.mainSection}>
          <ScrollReveal className={`${styles.inner} ${styles.textCenter}`}>

            {/* Stage: Pitch */}
            <div className={styles.pitchBlock}>
              <p className="section-label" style={{ color: 'var(--color-orange)' }}>One-on-One Styling</p>
              <p className={styles.pitchBody}>
                Desire custom pieces made for just you, made with intention and attention to who you are? Desire a personal style-up and wardrobe overhaul? Book a one-on-one session with us.
              </p>
              {stage === 'pitch' && (
                <button type="button" className={styles.primaryBtn} onClick={() => setStage('price')} id="consultation-book-session">
                  Book a Session
                </button>
              )}
            </div>

            {/* Stage: Price */}
            {(stage === 'price' || stage === 'form' || stage === 'success') && (
              <div className={styles.priceBlock} id="consultation-price">
                <p className={styles.priceValue}>30 Minutes &middot; $150</p>
                <p className={styles.priceNote}>Payment is arranged after your session request is confirmed by email.</p>
                {stage === 'price' && (
                  <button type="button" className={styles.primaryBtn} onClick={() => setStage('form')} id="consultation-proceed">
                    Proceed
                  </button>
                )}
              </div>
            )}

            {/* Stage: Form */}
            {stage === 'form' && (
              <form className={styles.form} onSubmit={handleSubmit} noValidate id="consultation-form">
                <div className={styles.row}>
                  <div className={styles.field}>
                    <label className={styles.label} htmlFor="consultation-name">Full Name</label>
                    <input
                      id="consultation-name"
                      name="name"
                      type="text"
                      className={`${styles.input} ${errors.name ? styles.inputError : ''}`}
                      placeholder="Your full name"
                      value={form.name}
                      onChange={handleChange}
                      autoComplete="name"
                    />
                    {errors.name && <p className={styles.errorMsg} role="alert">{errors.name}</p>}
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label} htmlFor="consultation-email">Email Address</label>
                    <input
                      id="consultation-email"
                      name="email"
                      type="email"
                      className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
                      placeholder="your@email.com"
                      value={form.email}
                      onChange={handleChange}
                      autoComplete="email"
                    />
                    {errors.email && <p className={styles.errorMsg} role="alert">{errors.email}</p>}
                  </div>
                </div>

                <div className={styles.row}>
                  <div className={styles.field}>
                    <label className={styles.label} htmlFor="consultation-country">Country of Residence</label>
                    <input
                      id="consultation-country"
                      name="country"
                      type="text"
                      className={`${styles.input} ${errors.country ? styles.inputError : ''}`}
                      placeholder="e.g. Nigeria"
                      value={form.country}
                      onChange={handleChange}
                      autoComplete="country-name"
                    />
                    {errors.country && <p className={styles.errorMsg} role="alert">{errors.country}</p>}
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label} htmlFor="consultation-whatsapp">WhatsApp Number</label>
                    <input
                      id="consultation-whatsapp"
                      name="whatsapp"
                      type="tel"
                      className={`${styles.input} ${errors.whatsapp ? styles.inputError : ''}`}
                      placeholder="+1 234 567 8900"
                      value={form.whatsapp}
                      onChange={handleChange}
                      autoComplete="tel"
                    />
                    {errors.whatsapp && <p className={styles.errorMsg} role="alert">{errors.whatsapp}</p>}
                  </div>
                </div>

                <div className={styles.field}>
                  <label className={styles.label} htmlFor="consultation-goal">What do you look forward to achieving with this session?</label>
                  <textarea
                    id="consultation-goal"
                    name="goal"
                    className={`${styles.input} ${styles.textarea} ${errors.goal ? styles.inputError : ''}`}
                    placeholder="Tell us what you're hoping for..."
                    rows={5}
                    value={form.goal}
                    onChange={handleChange}
                  />
                  {errors.goal && <p className={styles.errorMsg} role="alert">{errors.goal}</p>}
                </div>

                <button
                  type="submit"
                  className={styles.submitBtn}
                  disabled={status === 'loading'}
                  id="consultation-submit"
                >
                  {status === 'loading' ? 'Sending...' : 'Request Session'}
                </button>
              </form>
            )}

            {/* Stage: Success */}
            {stage === 'success' && (
              <div className={styles.successState}>
                <div className={styles.successIcon}>&#10003;</div>
                <h2 className={styles.successHeading}>Request received.</h2>
                <p className={styles.successBody}>
                  Thank you for reaching out. Our concierge team will follow up by email within 24 hours with next steps, including how to complete payment for your session.
                </p>
              </div>
            )}

          </ScrollReveal>
        </section>

      </main>
      <Footer />
    </>
  );
}
