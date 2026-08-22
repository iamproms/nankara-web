import Navbar from '../components/Navbar/Navbar';
import Footer from '../components/Footer/Footer';
import HeroVideo from '../components/HeroVideo/HeroVideo';
import FeaturedCollection from '../components/FeaturedCollection/FeaturedCollection';
import BrandStatement from '../components/BrandStatement/BrandStatement';
import NewsletterSection from '../components/NewsletterSection/NewsletterSection';

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main id="main-content">
        <HeroVideo />
        <FeaturedCollection />
        <BrandStatement />
        <NewsletterSection />
      </main>
      <Footer />
    </>
  );
}
