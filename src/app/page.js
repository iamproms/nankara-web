import Navbar from '../components/Navbar/Navbar';
import Footer from '../components/Footer/Footer';
import HeroVideo from '../components/HeroVideo/HeroVideo';
import BrandStatement from '../components/BrandStatement/BrandStatement';
import TheWomanWeDesignFor from '../components/TheWomanWeDesignFor/TheWomanWeDesignFor';
import StorySection from '../components/StorySection/StorySection';
import FeaturedCollection from '../components/FeaturedCollection/FeaturedCollection';
import CraftsmanshipSection from '../components/CraftsmanshipSection/CraftsmanshipSection';
import EditorialShowcase from '../components/EditorialShowcase/EditorialShowcase';
import NewsletterSection from '../components/NewsletterSection/NewsletterSection';

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main id="main-content">
        <HeroVideo />
        <BrandStatement />
        <TheWomanWeDesignFor />
        <StorySection />
        <FeaturedCollection />
        <CraftsmanshipSection />
        <EditorialShowcase />
        <NewsletterSection />
      </main>
      <Footer />
    </>
  );
}
