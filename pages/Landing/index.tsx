import React, { useState } from 'react';
import { SpotlightCursor, ThemeToggle } from './components/Shared';
import Hero from './components/Hero';
import Stats from './components/Stats';
import Story from './components/Story';
import ProductShowcase from './components/ProductShowcase';
import { MarqueeBand, MarqueeBand2 } from './components/MarqueeSection';
import GiftSets from './components/GiftSets';
import Founder from './components/Founder';
import Process from './components/Process';
import Occasions from './components/Occasions';
import Testimonials from './components/Testimonials';
import HowToOrder from './components/HowToOrder';
import Instagram from './components/Instagram';
import FAQ from './components/FAQ';
import Newsletter from './components/Newsletter';
import CTA from './components/CTA';
import Footer from './components/Footer';
import Styles from './components/Styles';

const LandingPage: React.FC = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'light';
    const saved = localStorage.getItem('cq-landing-theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('cq-landing-theme', theme);
    }
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));

  return (
    <div className={`cq2-root ${theme === 'dark' ? 'cq2-dark' : ''}`}>
      <Styles />
      <SpotlightCursor />
      <ThemeToggle theme={theme} onToggle={toggleTheme} />
      <Hero />
      <Stats />
      <Story />
      <Founder />
      <MarqueeBand />
      <ProductShowcase />
      <Process />
      <Occasions />
      <MarqueeBand2 />
      <GiftSets />
      <Testimonials />
      <HowToOrder />
      <Instagram />
      <FAQ />
      <Newsletter />
      <CTA />
      <Footer />
    </div>
  );
};

export default LandingPage;
