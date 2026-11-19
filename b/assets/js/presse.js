// La presse : le monogramme reste collé à l'écran pendant que les pôles défilent.
// Le pôle qui traverse le milieu de la fenêtre « passe en couleur » : sa pièce du
// monogramme prend sa teinte (Option A du graphiste : une seule activité colorée à la fois).
export function initPresse() {
  const presse = document.querySelector('[data-presse]');
  const poles = document.querySelectorAll('[data-pole]');
  if (!presse || !poles.length || !('IntersectionObserver' in window)) return;

  const obs = new IntersectionObserver((entrees) => {
    for (const e of entrees) {
      const nom = e.target.dataset.pole;
      if (e.isIntersecting) presse.dataset.actif = nom;
      else if (presse.dataset.actif === nom) delete presse.dataset.actif;
    }
  }, { rootMargin: '-55% 0px -44% 0px' }); // bande fine un peu sous le milieu de l'écran
  poles.forEach((p) => obs.observe(p));
}
