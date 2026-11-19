// Empreintes déposées au défilement : un IntersectionObserver ajoute .est-imprime,
// l'animation (rebond + opacité) est entièrement en CSS (voir @keyframes frappe).
// Aucun écouteur de scroll : fonctionne à l'identique au doigt et à la molette.
export function initEmpreintes() {
  const cibles = document.querySelectorAll('[data-empreinte]');
  const cale = document.querySelector('[data-cale]');
  if (!('IntersectionObserver' in window)) {
    cibles.forEach((el) => el.classList.add('est-imprime'));
    cale?.classList.add('est-cale');
    return;
  }
  const obs = new IntersectionObserver((entrees) => {
    for (const e of entrees) {
      if (!e.isIntersecting) continue;
      e.target.classList.add('est-imprime');
      obs.unobserve(e.target);
    }
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.2 });
  cibles.forEach((el) => obs.observe(el));

  // Le trait noir du grand monogramme glisse vers son défaut de repérage après le chargement.
  if (cale) requestAnimationFrame(() => requestAnimationFrame(() => cale.classList.add('est-cale')));
}
