// Affiches collées : un clic / un tap dépose une empreinte à l'endroit touché.
// L'empreinte est posée SOUS le carton de texte (z-index), elle ne gêne jamais la lecture.
const NS = 'http://www.w3.org/2000/svg';
const COULEURS = ['var(--noir)', 'var(--bleu)', 'var(--vert)']; // bleu et vert : touches seulement
const MAX_PAR_AFFICHE = 6; // borne le nombre d'éléments filtrés

function creerEmpreinte(x, y, n) {
  const el = document.createElement('div');
  el.className = 'depot';
  el.style.left = `${x}px`;
  el.style.top = `${y}px`;
  el.style.setProperty('--c', COULEURS[n % COULEURS.length]);
  el.style.setProperty('--r', `${Math.round(Math.random() * 50 - 25)}deg`);
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '0 0 100 100');
  svg.setAttribute('class', 'encre');
  svg.innerHTML = '<circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" stroke-width="4"/>'
    + '<use href="assets/svg/monogramme.svg#mono" x="25" y="23" width="50" height="54"/>';
  el.append(svg);
  return el;
}

export function initAffiches() {
  document.querySelectorAll('[data-affiche]').forEach((affiche) => {
    const couche = affiche.querySelector('.affiche__empreintes');
    let n = 0;
    affiche.addEventListener('click', (e) => {
      if (e.target.closest('a, button')) return; // « Réserver » garde son comportement
      const r = couche.getBoundingClientRect();
      // Coordonnées ramenées dans le repère de l'affiche (elle est inclinée) : approximation suffisante.
      const x = (e.clientX - r.left) * (couche.offsetWidth / r.width);
      const y = (e.clientY - r.top) * (couche.offsetHeight / r.height);
      couche.append(creerEmpreinte(x, y, n++));
      while (couche.children.length > MAX_PAR_AFFICHE) couche.firstElementChild.remove();
    });
  });
}
