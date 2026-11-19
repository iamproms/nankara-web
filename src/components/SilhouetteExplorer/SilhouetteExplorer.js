'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import styles from './SilhouetteExplorer.module.css';

const SHAPES = [
  {
    id: 'pear',
    name: 'Pear',
    image: '/images/silhouette-guide/pear.png',
    description:
      'The hips are visually wider than the shoulders or bust, often with a clearly defined waist.',
    focus: 'Balance the upper and lower body while defining the waist.',
    silhouettes: [
      'A-line dresses and skirts',
      'Fit-and-flare, wrap and defined-waist dresses',
      'Boat, square and wider necklines',
      'Fitted gowns',
      'Statement sleeves and structured shoulders',
      'Wide-leg trousers with a clean fit through the hip',
    ],
    why:
      'These silhouettes add visual presence around the upper body and create a smooth line over the hips, helping the proportions feel balanced.',
  },
  {
    id: 'hourglass',
    name: 'Hourglass',
    image: '/images/silhouette-guide/hourglass.png',
    description:
      'The shoulders or bust and hips are broadly balanced, with a noticeably narrower, defined waist.',
    focus: 'Follow the body’s natural proportions and preserve waist definition.',
    silhouettes: [
      'Wrap dresses and tops',
      'Fitted or softly tailored dresses',
      'Belted waists',
      'High-rise bottoms with pencil or straight skirts',
      'Fit-and-flare dresses',
      'Tailored jackets shaped gently at the waist',
      'V- and scoop necklines',
    ],
    why:
      'Waist definition and garments that follow rather than obscure the body’s natural lines complement its balanced proportions.',
  },
  {
    id: 'inverted-triangle',
    name: 'Inverted triangle',
    image: '/images/silhouette-guide/inverted-triangle.png',
    description:
      'The shoulders or bust are visually broader than the hips, often with a comparatively narrower lower body.',
    focus:
      'Balance the upper and lower body and create softness or visual interest below the waist.',
    silhouettes: [
      'A-line and full-skirted dresses',
      'Fit-and-flare styles',
      'Wide-leg or bootcut trousers',
      'Pleated and fuller skirts',
      'Simple V- or scoop-neck tops',
      'Softer shoulder lines with more visual interest below',
    ],
    why:
      'Controlled volume and detail on the lower half can visually balance a broader upper body. Because this shape has many variations, personal guidance can make recommendations more precise.',
  },
  {
    id: 'apple',
    name: 'Apple',
    image: '/images/silhouette-guide/apple-source.png',
    imageClass: styles.appleImage,
    description:
      'The midsection is often the fullest area, with comparatively slimmer or less prominent hips. Proportions vary considerably from woman to woman.',
    focus: 'Create a long, clean line and place definition where it feels most comfortable.',
    silhouettes: [
      'Empire and raised-waist dresses',
      'A-line and softly draped dresses',
      'V-necklines with open jackets',
      'Fitted gowns with a comfortable cinched waist',
      'Straight, fitted or wide-leg trousers with a comfortable rise',
      'Monochromatic and column-like looks',
      'Gently structured pieces',
    ],
    why:
      'Long vertical lines, controlled drape and comfortable shaping create visual ease without asking the body to conform to the garment.',
  },
  {
    id: 'rectangle',
    name: 'Rectangle',
    image: '/images/silhouette-guide/rectangle.png',
    description:
      'The shoulders or bust, waist and hips are relatively similar in width, with less natural waist indentation.',
    focus: 'Create shape, dimension and a visible waist when desired.',
    silhouettes: [
      'Wrap tops and dresses',
      'Belted styles',
      'Peplum and waist-flared dresses',
      'Shaped or cropped jackets',
      'High-rise bottoms with pleated or fuller skirts',
      'Fit-and-flare dresses',
      'Strategic draping, ruching and structure',
    ],
    why:
      'Waist placement, seaming and controlled volume create visual contrast between the waist and the surrounding areas.',
  },
];

export default function SilhouetteExplorer() {
  const [activeId, setActiveId] = useState(SHAPES[0].id);
  const itemRefs = useRef({});
  const active = SHAPES.find((shape) => shape.id === activeId) || SHAPES[0];

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target?.id) setActiveId(visible.target.id.replace('shape-', ''));
      },
      { rootMargin: '-28% 0px -42% 0px', threshold: [0.1, 0.35, 0.6] }
    );

    Object.values(itemRefs.current).forEach((node) => node && observer.observe(node));
    return () => observer.disconnect();
  }, []);

  const choose = (id) => {
    setActiveId(id);
    itemRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  return (
    <section className={styles.explorer} id="find-your-shape" aria-labelledby="shape-heading">
      <div className={styles.headingRow}>
        <h2 id="shape-heading">Find your shape</h2>
        <p>Choose a shape or scroll through all five guides.</p>
      </div>

      <div className={styles.shapeNav} aria-label="Body shapes">
        {SHAPES.map((shape) => (
          <button
            type="button"
            key={shape.id}
            className={activeId === shape.id ? styles.navActive : ''}
            onClick={() => choose(shape.id)}
            aria-pressed={activeId === shape.id}
          >
            {shape.name}
          </button>
        ))}
      </div>

      <div className={styles.guideLayout}>
        <div className={styles.stickyVisual} aria-live="polite">
          <div className={styles.imageFrame}>
            <Image
              key={active.id}
              src={active.image}
              alt={`${active.name} body-shape illustration`}
              fill
              sizes="(max-width: 760px) 100vw, 38vw"
              className={`${styles.shapeImage} ${active.imageClass || ''}`}
            />
          </div>
        </div>

        <div className={styles.chapters}>
          {SHAPES.map((shape) => (
            <article
              key={shape.id}
              id={`shape-${shape.id}`}
              ref={(node) => { itemRefs.current[shape.id] = node; }}
              className={`${styles.chapter} ${activeId === shape.id ? styles.chapterActive : ''}`}
            >
              <div className={styles.mobileImage}>
                <Image
                  src={shape.image}
                  alt={`${shape.name} body-shape illustration`}
                  fill
                  sizes="calc(100vw - 2rem)"
                  className={`${styles.shapeImage} ${shape.imageClass || ''}`}
                />
              </div>
              <h3>{shape.name}</h3>
              <div className={styles.definition}>
                <h4>What it looks like</h4>
                <p>{shape.description}</p>
              </div>
              <div className={styles.definition}>
                <h4>Style focus</h4>
                <p>{shape.focus}</p>
              </div>
              <div className={styles.definition}>
                <h4>Flattering silhouettes</h4>
                <ul>
                  {shape.silhouettes.map((item) => <li key={item}>{item}</li>)}
                </ul>
              </div>
              <div className={styles.definition}>
                <h4>Why these work</h4>
                <p>{shape.why}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
