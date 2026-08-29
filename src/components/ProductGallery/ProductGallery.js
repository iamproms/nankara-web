'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';

import styles from './ProductGallery.module.css';

// Two presentations of the same images, toggled by CSS at 900px:
//  - Desktop: one large "stage" image + a thumbnail strip (click to change).
//  - Mobile: a native CSS scroll-snap carousel with dot indicators (no JS lib).
// `data-lenis-prevent` stops Lenis hijacking the horizontal swipe; we deliberately do
// NOT set `touch-action` so a vertical swipe starting on the image still scrolls the
// page.
export default function ProductGallery({ images = [], productName }) {
  const [active, setActive] = useState(0);
  const trackRef = useRef(null);
  const slideRefs = useRef([]);

  const altFor = useCallback(
    (img, index) => img.alt_text || `${productName} — view ${index + 1}`,
    [productName]
  );

  // Drive the active dot from whichever slide is centred in the mobile track.
  useEffect(() => {
    const track = trackRef.current;
    if (!track || images.length < 2) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const index = slideRefs.current.indexOf(entry.target);
            if (index !== -1) setActive(index);
          }
        }
      },
      { root: track, threshold: 0.6 }
    );

    slideRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, [images.length]);

  if (images.length === 0) {
    return (
      <div className={styles.gallery} id="product-gallery">
        <div className={styles.placeholder} aria-hidden="true" />
      </div>
    );
  }

  const activeImage = images[Math.min(active, images.length - 1)];

  return (
    <div className={styles.gallery} id="product-gallery">
      {/* Desktop stage */}
      <div className={styles.stage}>
        <Image
          key={activeImage.id}
          src={activeImage.url}
          alt={altFor(activeImage, active)}
          fill
          sizes="(max-width: 900px) 100vw, 55vw"
          style={{ objectFit: 'cover', filter: 'var(--photo-tone)' }}
          priority
        />
      </div>

      {/* Mobile carousel */}
      <div className={styles.track} ref={trackRef} data-lenis-prevent>
        {images.map((img, index) => (
          <div
            key={img.id}
            className={styles.slide}
            ref={(el) => {
              slideRefs.current[index] = el;
            }}
          >
            <Image
              src={img.url}
              alt={altFor(img, index)}
              fill
              sizes="100vw"
              style={{ objectFit: 'cover', filter: 'var(--photo-tone)' }}
              priority={index === 0}
            />
          </div>
        ))}
      </div>

      {images.length > 1 && (
        <>
          <div className={styles.dots} aria-hidden="true">
            {images.map((img, index) => (
              <span
                key={img.id}
                className={`${styles.dot} ${index === active ? styles.dotActive : ''}`}
              />
            ))}
          </div>

          <div className={styles.thumbs}>
            {images.map((img, index) => (
              <button
                key={img.id}
                type="button"
                id={`product-gallery-thumb-${img.id}`}
                className={`${styles.thumb} ${index === active ? styles.thumbActive : ''}`}
                onClick={() => setActive(index)}
                aria-label={`Show ${altFor(img, index)}`}
                aria-current={index === active}
              >
                <Image
                  src={img.url}
                  alt=""
                  fill
                  sizes="120px"
                  style={{ objectFit: 'cover', filter: 'var(--photo-tone)' }}
                />
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
