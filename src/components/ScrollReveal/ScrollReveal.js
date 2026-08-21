'use client';
import { useScrollReveal } from '../../hooks/useScrollReveal';

export default function ScrollReveal({ children, className = '' }) {
  const [revealRef, isVisible] = useScrollReveal();
  return (
    <div ref={revealRef} className={`${className} ${isVisible ? 'reveal-visible' : 'reveal-hidden'}`}>
      {children}
    </div>
  );
}
