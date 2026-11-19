// La salle : noir, faisceau du projecteur, interrupteur « Allumer la salle », lever de rideau au scroll.
// Tout est piloté par deux boucles requestAnimationFrame qui ne tournent que si la scène est visible.

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const plage = (p, a, b) => clamp((p - a) / (b - a)); // progression locale entre deux seuils
const doux = (t) => t * t * (3 - 2 * t);

export function initSalle({ reduit }) {
  const racine = document.documentElement;
  const salle = document.querySelector('.salle');
  if (!salle) return null;
  const scene = salle.querySelector('.salle__scene');
  const noir = salle.querySelector('.noir');
  const bouton = salle.querySelector('.interrupteur');
  const lent = document.body.classList.contains('pole-bien-etre'); // rythme « respiration »

  /* --- Interrupteur ------------------------------------------------------- */
  let allumee = reduit;
  try { allumee = allumee || sessionStorage.getItem('salle') === 'allumee'; } catch (e) { /* stockage indisponible */ }
  const appliquer = () => {
    racine.classList.toggle('salle-allumee', allumee);
    bouton.setAttribute('aria-pressed', String(allumee));
    bouton.lastChild.textContent = allumee ? 'Éteindre la salle' : 'Allumer la salle';
    if (!allumee) lancer();
  };
  bouton.addEventListener('click', () => {
    allumee = !allumee;
    try { sessionStorage.setItem('salle', allumee ? 'allumee' : 'eteinte'); } catch (e) { /* idem */ }
    appliquer();
  });

  /* --- Faisceau ----------------------------------------------------------- */
  // cible = pointeur (ou balayage automatique tant que personne n'a bougé) ; pos = cible lissée.
  const cible = { x: 0.62, y: 0.42 };
  const pos = { x: 0.62, y: 0.42 };
  const inertie = lent ? 0.06 : 0.16;
  let dernierGeste = -1e9;
  let visible = true;
  let ouverture = 0; // 0 = faisceau serré, 1 = la lumière a envahi la salle (piloté par le scroll)
  let boucle = 0;
  const mesures = []; // durées inter-images, lues par le script de mesure (window.__faisceau)

  const viser = (x, y) => {
    const r = scene.getBoundingClientRect();
    cible.x = clamp((x - r.left) / r.width);
    cible.y = clamp((y - r.top) / r.height);
    dernierGeste = performance.now();
  };
  window.addEventListener('pointermove', (e) => viser(e.clientX, e.clientY), { passive: true });
  window.addEventListener('touchmove', (e) => viser(e.touches[0].clientX, e.touches[0].clientY), { passive: true });

  let avant = 0;
  function image(t) {
    boucle = 0;
    if (avant) mesures.push(t - avant);
    if (mesures.length > 600) mesures.shift();
    avant = t;
    // Balayage automatique doux (mobile, ou souris immobile) : repris 4 s après le dernier geste.
    if (!reduit && t - dernierGeste > 4000) {
      const s = t / (lent ? 5200 : 2600);
      cible.x = 0.5 + 0.36 * Math.sin(s);
      cible.y = 0.36 + 0.2 * Math.sin(s * 1.7 + 1);
    }
    pos.x += (cible.x - pos.x) * inertie;
    pos.y += (cible.y - pos.y) * inertie;
    const souffle = lent && !reduit ? 1 + 0.1 * Math.sin(t / 1270) : 1; // cycle d'environ 8 s
    noir.style.setProperty('--bx', (pos.x * 100).toFixed(2) + '%');
    noir.style.setProperty('--by', (pos.y * 100).toFixed(2) + '%');
    noir.style.setProperty('--br', (26 * souffle * (1 + 7 * ouverture)).toFixed(2) + 'vmax');
    lancer();
  }
  function lancer() {
    if (!boucle && visible && !allumee && ouverture < 1) boucle = requestAnimationFrame(image);
    else if (!boucle) avant = 0;
  }
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; lancer(); }).observe(scene);
  window.__faisceau = mesures;

  /* --- Lever de rideau (mode scénique seulement) -------------------------- */
  if (!reduit) {
    racine.classList.add('scenique');
    const cartel = salle.querySelector('.cartel');
    const [gauche, droite] = salle.querySelectorAll('.rideau__pan');
    const mono = salle.querySelector('.plateau__mono');
    const inondation = salle.querySelector('.plateau__inondation');
    const zoomMax = Number(mono.dataset.zoom || 60);
    let demande = 0;

    const regler = () => {
      demande = 0;
      const r = salle.getBoundingClientRect();
      const p = clamp(-r.top / (r.height - window.innerHeight));
      // 1. le cartel s'efface, 2. la lumière monte, 3. le rideau s'ouvre, 4. le monogramme devient l'écran
      const c = plage(p, 0.03, 0.14);
      cartel.style.opacity = 1 - c;
      cartel.style.transform = `translateY(${c * 40}px)`;
      cartel.style.visibility = c === 1 ? 'hidden' : '';
      ouverture = doux(plage(p, 0.08, 0.3));
      if (!allumee) noir.style.opacity = ouverture === 1 ? 0 : '';
      const o = doux(plage(p, 0.26, 0.62)) * 101;
      gauche.style.transform = `translateX(${-o}%)`;
      droite.style.transform = `translateX(${o}%)`;
      // Zoom exponentiel : la vitesse perçue reste constante du début à la fin.
      const z = plage(p, 0.56, 0.96);
      mono.style.transform = `scale(${Math.pow(zoomMax, z * z).toFixed(4)})`;
      inondation.style.opacity = plage(p, 0.9, 0.97);
      lancer();
    };
    const planifier = () => { if (!demande) demande = requestAnimationFrame(regler); };
    window.addEventListener('scroll', planifier, { passive: true });
    window.addEventListener('resize', planifier);
    regler();
  }

  racine.classList.add('js');
  appliquer();
  return { mesures };
}
