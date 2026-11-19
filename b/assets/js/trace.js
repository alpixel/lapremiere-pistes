// Trace d'encre du curseur (souris uniquement) : des gouttes brèves qui s'effacent.
// Un seul canvas plein écran, à densité 1, redessiné seulement tant qu'il reste des gouttes.
const VIE = 520; // ms

export function initTrace() {
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  const canvas = document.createElement('canvas');
  canvas.className = 'trace';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.append(canvas);
  const ctx = canvas.getContext('2d');
  const couleur = getComputedStyle(document.body).getPropertyValue('--dom').trim() || '#F43D5C';
  let gouttes = [];
  let dernier = null;
  let enCours = false;

  const dimensionner = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
  dimensionner();
  window.addEventListener('resize', dimensionner);

  window.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    const p = { x: e.clientX, y: e.clientY };
    const d = dernier ? Math.hypot(p.x - dernier.x, p.y - dernier.y) : 0;
    if (dernier && d < 6) return;
    // Plus le geste est rapide, plus la goutte est fine (l'encre s'étire).
    const rayon = Math.max(3, 11 - d * 0.12) * (0.7 + Math.random() * 0.6);
    gouttes.push({ x: p.x + (Math.random() - 0.5) * 4, y: p.y + (Math.random() - 0.5) * 4, r: rayon, t: performance.now() });
    if (gouttes.length > 90) gouttes.shift();
    dernier = p;
    if (!enCours) { enCours = true; requestAnimationFrame(dessiner); }
  }, { passive: true });

  function dessiner(maintenant) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    gouttes = gouttes.filter((g) => maintenant - g.t < VIE);
    ctx.fillStyle = couleur;
    for (const g of gouttes) {
      const v = 1 - (maintenant - g.t) / VIE;
      ctx.globalAlpha = v * 0.7;
      ctx.beginPath();
      ctx.arc(g.x, g.y, g.r * (0.6 + v * 0.4), 0, Math.PI * 2);
      ctx.fill();
    }
    if (gouttes.length) requestAnimationFrame(dessiner);
    else enCours = false;
  }
}
