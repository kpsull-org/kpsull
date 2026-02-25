'use client';

import { useEffect } from 'react';

// Toutes les classes kp-* qui doivent être révélées au scroll
// (hors kp-page-enter et kp-animate-hero-* qui sont time-based dès le mount)
const SELECTORS = [
  '.kp-scroll-reveal',
  '.kp-scroll-reveal-delay-1',
  '.kp-scroll-reveal-delay-2',
  '.kp-scroll-reveal-delay-3',
  '.kp-scroll-reveal-delay-4',
  '.kp-blur-in',
  '.kp-luxury-reveal',
  '.kp-luxury-delay-1',
  '.kp-luxury-delay-2',
  '.kp-luxury-delay-3',
  '.kp-luxury-delay-4',
  '.kp-scale-divider',
].join(', ');

/**
 * ScrollRevealProvider
 *
 * Met en place un IntersectionObserver global qui ajoute la classe
 * `.kp-revealed` quand au moins 15% d'un élément est visible.
 * Un MutationObserver surveille le DOM pour observer automatiquement
 * les nouveaux éléments (infinite scroll, chargements dynamiques).
 */
export function ScrollRevealProvider() {
  useEffect(() => {
    // Déclenche l'animation une fois que 15% de l'élément est visible
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('kp-revealed');
            // Animation one-shot : on arrête d'observer l'élément
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );

    const observeAll = (root: ParentNode = document) => {
      root.querySelectorAll<Element>(SELECTORS).forEach((el) => io.observe(el));
    };

    // Observer tous les éléments déjà dans le DOM
    observeAll();

    // Observer les nouveaux éléments ajoutés (infinite scroll, lazy load…)
    const mo = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (!(node instanceof Element)) return;
          if (node.matches(SELECTORS)) io.observe(node);
          observeAll(node);
        });
      });
    });

    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      io.disconnect();
      mo.disconnect();
    };
  }, []);

  return null;
}
