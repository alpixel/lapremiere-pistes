// Typographie cinétique : découpe en lettres et titres qui s'étirent au défilement.

const reduit = matchMedia('(prefers-reduced-motion: reduce)');

// Découpe un titre en lettres animables. Le texte complet reste lu d'un bloc (copie .sr),
// les lettres sont masquées aux lecteurs d'écran.
export function decouper(racine = document) {
  racine.querySelectorAll('[data-lettres]').forEach((el) => {
    const texte = el.textContent.trim();
    const lu = document.createElement('span');
    lu.className = 'sr';
    lu.textContent = texte;
    el.replaceChildren(lu);
    [...texte].forEach((car, i) => {
      const s = document.createElement('span');
      s.className = 'lettre';
      s.setAttribute('aria-hidden', 'true');
      s.style.setProperty('--i', i);
      s.textContent = car === ' ' ? ' ' : car;
      el.append(s);
    });
  });
}

// Chaque .etire reçoit --p (0 à 1) selon sa traversée du bas vers le milieu de l'écran ;
// le CSS convertit --p en largeur de police (axe wdth). Rien n'est calculé hors écran.
export function initEtirement() {
  const titres = [...document.querySelectorAll('.etire')];
  if (!titres.length || reduit.matches) return;

  const visibles = new Set();
  const io = new IntersectionObserver((entrees) => {
    entrees.forEach((e) => (e.isIntersecting ? visibles.add(e.target) : visibles.delete(e.target)));
    planifier();
  });
  titres.forEach((t) => io.observe(t));

  // Plafond propre à chaque titre : étiré au maximum, le mot remplit sa colonne sans jamais déborder.
  // La largeur du mot varie quasi linéairement avec l'axe wdth : deux mesures suffisent.
  const plafonds = new Map();
  const mesurer = () => {
    // scrollWidth ne descend jamais sous la largeur du bloc : on mesure le texte lui-même
    const plage = document.createRange();
    const largeurTexte = (t) => { plage.selectNodeContents(t); return plage.getBoundingClientRect().width; };
    titres.forEach((t) => {
      t.style.setProperty('--p', 1); const large = largeurTexte(t);
      t.style.setProperty('--p', 0); const etroit = largeurTexte(t);
      const libre = t.clientWidth;
      plafonds.set(t, Math.min(1, Math.max(0, ((libre - etroit) / (large - etroit || 1)) * 0.97)));
    });
    planifier();
  };

  let attente = false;
  const maj = () => {
    attente = false;
    const h = innerHeight;
    visibles.forEach((t) => {
      const r = t.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, (h - r.top) / (h * 0.6)));
      t.style.setProperty('--p', (p * (plafonds.get(t) ?? 0)).toFixed(3));
    });
  };
  const planifier = () => {
    if (!attente) { attente = true; requestAnimationFrame(maj); }
  };
  addEventListener('scroll', planifier, { passive: true });
  addEventListener('resize', mesurer);
  document.fonts.ready.then(mesurer);
}
