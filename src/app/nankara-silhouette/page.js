import Image from 'next/image';
import Link from 'next/link';
import Navbar from '../../components/Navbar/Navbar';
import Footer from '../../components/Footer/Footer';
import SilhouetteExplorer from '../../components/SilhouetteExplorer/SilhouetteExplorer';
import styles from './nankara-silhouette.module.css';

export const metadata = {
  title: 'Nankara Silhouette Guide | Nankara',
  description:
    'Understand your body proportions and discover the silhouettes that complement you, so you can choose every Nankara piece with confidence.',
};

export default function NankaraSilhouettePage() {
  return (
    <>
      <Navbar />
      <main id="silhouette-main" className={styles.page}>
        <section className={styles.hero} id="silhouette-hero">
          <Image
            src="/images/nankara-14.jpg"
            alt="A Nankara woman wearing a sculpted silhouette"
            fill
            sizes="100vw"
            className={styles.heroImage}
            priority
          />
          <div className={styles.heroScrim} />
          <h1 className={styles.heroTitle}>Silhouette Guide</h1>
          <div className={styles.heroIntroduction}>
            <p>
              Understand your proportions and choose outfits that feel comfortable,
              flattering and authentically you.
            </p>
            <a href="#find-your-shape" className={styles.heroAction}>
              Find your shape
            </a>
          </div>
        </section>

        <section className={styles.intro} aria-labelledby="silhouette-meaning">
          <div className={styles.introCopy}>
            <h2 id="silhouette-meaning">What a silhouette means</h2>
            <p className={styles.statement}>
              A silhouette is the shape a garment creates around the body: its width,
              length, structure and proportions.
            </p>
            <div className={styles.introBody}>
              <p>
                The way a dress looks on a model does not always tell you how it will
                look on your body. Understanding your proportions helps you choose
                pieces that flatter your figure before you shop them.
              </p>
              <p>
                Your body may sit between two or more shapes, and every shape can wear
                almost every silhouette with thoughtful styling. This guide is a tool,
                never a restriction.
              </p>
            </div>
          </div>
          <div className={styles.introPictures} aria-hidden="true">
            <div className={styles.introPortrait}>
              <Image src="/images/nankara-09.jpg" alt="" fill sizes="34vw" />
            </div>
            <div className={styles.introDetail}>
              <Image src="/images/nankara-05.jpg" alt="" fill sizes="24vw" />
            </div>
          </div>
        </section>

        <SilhouetteExplorer />

        <section className={styles.rule} aria-labelledby="nankara-rule">
          <div className={styles.ruleImage}>
            <Image
              src="/images/nankara-06.jpg"
              alt="A Nankara garment shaped through careful construction"
              fill
              sizes="(max-width: 760px) 100vw, 42vw"
            />
          </div>
          <div className={styles.ruleCopy}>
            <h2 id="nankara-rule">The Nankara rule</h2>
            <blockquote>
              Your silhouette is a guide, not a restriction. The best fit honours your
              body and your expression.
            </blockquote>
            <p>
              Nankara uses construction, not excessive tightness, to create a beautiful
              sense of shape.
            </p>
          </div>
        </section>

        <section className={styles.personalHelp} aria-labelledby="stylist-help">
          <div>
            <h2 id="stylist-help">Still deciding?</h2>
            <p>
              Get personalised guidance on what to choose from the collection and shop
              with greater confidence.
            </p>
          </div>
          <Link href="/contact" className={styles.helpLink}>
            Ask a stylist
          </Link>
        </section>

        <section className={styles.queenCircle} aria-labelledby="queen-circle-heading">
          <div className={styles.queenImage}>
            <Image
              src="/images/nankara-15.jpg"
              alt="The private Queens Circle experience"
              fill
              sizes="(max-width: 760px) 100vw, 50vw"
            />
          </div>
          <div className={styles.queenCopy}>
            <h2 id="queen-circle-heading">Created around you</h2>
            <p>
              The pieces you see on Nankara are created for women like you. Queens Circle
              is a more personal experience where your style, lifestyle and the woman you
              are becoming are understood more deeply.
            </p>
            <Link href="/queens-circle">Discover Queens Circle</Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
