// Acte II : le projecteur change de gélatine selon le pôle survolé (souris, clavier)
// ou selon le pôle qui traverse le centre de l'écran (tactile).

export function initPoles({ reduit }) {
  const section = document.querySelector('.poles');
  if (!section) return;
  const gel = section.querySelector('.gel');
  const poles = [...section.querySelectorAll('.pole')];
  const tactile = window.matchMedia('(hover: none)').matches;

  const cible = { x: 0, y: 0 };
  const pos = { x: 0, y: 0 };
  let visible = false;
  let boucle = 0;
  let pret = false;

  const activer = (pole) => {
    section.dataset.pole = pole.dataset.pole;
    poles.forEach((p) => p.classList.toggle('est-actif', p === pole));
    if (tactile || !pret) viserElement(pole);
  };
  const viser = (x, y) => {
    const r = section.getBoundingClientRect();
    cible.x = x - r.left;
    cible.y = y - r.top;
    if (!pret) { pos.x = cible.x; pos.y = cible.y; pret = true; }
    lancer();
  };
  const viserElement = (el) => {
    const r = el.getBoundingClientRect();
    viser(r.left + r.width * 0.6, r.top + r.height / 2);
  };

  function image() {
    boucle = 0;
    const k = reduit ? 1 : 0.12;
    pos.x += (cible.x - pos.x) * k;
    pos.y += (cible.y - pos.y) * k;
    gel.style.transform = `translate(${pos.x.toFixed(1)}px, ${pos.y.toFixed(1)}px)`;
    if (Math.abs(cible.x - pos.x) + Math.abs(cible.y - pos.y) > 0.5) lancer();
  }
  function lancer() { if (!boucle && visible) boucle = requestAnimationFrame(image); }

  poles.forEach((pole) => {
    pole.addEventListener('pointerenter', () => activer(pole));
    pole.addEventListener('focusin', () => { activer(pole); viserElement(pole); });
  });
  if (!tactile) section.addEventListener('pointermove', (e) => viser(e.clientX, e.clientY), { passive: true });

  new IntersectionObserver(([e]) => { visible = e.isIntersecting; lancer(); }).observe(section);
  if (tactile) {
    // Bande étroite au centre de l'écran : le pôle qui la traverse prend la lumière.
    const centre = new IntersectionObserver((es) => {
      es.forEach((e) => { if (e.isIntersecting) activer(e.target); });
    }, { rootMargin: '-48% 0px -48% 0px' });
    poles.forEach((p) => centre.observe(p));
  }
  activer(poles[0]);
}
