// La salle : une conduite lumière automatique (trois coups, poursuite, montée générale),
// puis le lever de rideau au scroll. Aucune commande : la lumière est une courbe dans le temps.
// Une seule boucle requestAnimationFrame, qui ne tourne que si la scène est visible.

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const plage = (p, a, b) => clamp((p - a) / (b - a)); // progression locale entre deux seuils
const doux = (t) => t * t * (3 - 2 * t);
const elan = (t) => { const u = t - 1; return 1 + 2.9 * u * u * u + 1.9 * u * u; }; // dépasse un peu, puis se pose

// Conduite, en secondes (multipliées par le tempo de la page). Un seul climax : la fin de la montée.
const Q = {
  coups: [[0.4, 0.75], [0.85, 0.9], [1.3, 1.1]], // instant, intensité (crescendo)
  allumage: 1.9,          // après un silence de 0,6 s, la poursuite s'allume sur la première lettre
  balayage: [2.1, 3.7],   // elle parcourt le titre, lettre à lettre
  montee: [3.5, 4.9],     // la salle monte : le noir se retire
  repos: 6.1,             // le faisceau retombe en simple accent
};
const COURTE = 1.1;       // version courte (page déjà vue dans la session) : une simple montée
const CLE = 'la-premiere:ouverture-vue';

export function initSalle({ reduit }) {
  const racine = document.documentElement;
  const salle = document.querySelector('.salle');
  if (!salle) return null;
  // Mouvement réduit : état final éclairé, statique, sans séquence ni lever de rideau.
  if (reduit) { racine.classList.remove('conduite'); return { etat: () => ({ statique: true }) }; }
  racine.classList.add('conduite', 'scenique');

  const scene = salle.querySelector('.salle__scene');
  const noir = salle.querySelector('.noir');
  const faisceau = salle.querySelector('.faisceau');
  const cartel = salle.querySelector('.cartel');
  const [gauche, droite] = salle.querySelectorAll('.rideau__pan');
  const mono = salle.querySelector('.plateau__mono');
  const inondation = salle.querySelector('.plateau__inondation');
  const zoomMax = Number(mono.dataset.zoom || 60);
  const lent = document.body.classList.contains('pole-bien-etre'); // rythme « respiration »
  const T = lent ? 1.35 : 1;

  // La longue séquence ne se joue qu'une fois par session (toutes pages confondues) ;
  // ensuite une montée courte. « ?ouverture » dans l'adresse la rejoue (démonstration).
  let courte = false;
  try { courte = sessionStorage.getItem(CLE) === '1' && !new URLSearchParams(location.search).has('ouverture'); } catch (e) { /* stockage indisponible */ }

  /* --- Titre : une lettre = un span, les deux copies (une par pan) restent alignées ---------- */
  const jeux = [...salle.querySelectorAll('.titre-geant')].map((titre) => {
    const lettres = [];
    const marcher = (noeud) => [...noeud.childNodes].forEach((n) => {
      if (n.nodeType !== 3) return marcher(n);
      const morceaux = [...n.textContent].map((c) => {
        const s = document.createElement('span');
        s.className = 'lettre';
        s.textContent = c;
        lettres.push(s);
        return s;
      });
      n.replaceWith(...morceaux);
    });
    marcher(titre);
    // Le nom complet est porté par aria-label : les lettres isolées sont masquées aux lecteurs d'écran.
    if (titre.hasAttribute('aria-label')) [...titre.children].forEach((c) => c.setAttribute('aria-hidden', 'true'));
    return lettres;
  });
  const allumees = jeux[0].map(() => false);
  let reste = allumees.length;
  const eclairer = (i, delai = 0) => {
    if (allumees[i]) return;
    allumees[i] = true;
    reste--;
    jeux.forEach((j) => { j[i].style.transitionDelay = delai + 'ms'; j[i].classList.add('est-eclairee'); });
  };
  const toutEclairer = (pas = 45) => { let k = 0; allumees.forEach((a, i) => { if (!a) eclairer(i, pas * k++); }); };

  /* --- Poussière de lumière : quelques grains, visibles seulement dans le faisceau ----------- */
  const toile = document.createElement('canvas');
  toile.className = 'poussiere';
  toile.setAttribute('aria-hidden', 'true');
  faisceau.after(toile);
  const ctx = toile.getContext('2d');
  const grains = Array.from({ length: window.innerWidth < 700 ? 40 : 80 }, () => ({
    x: Math.random(), y: Math.random(), t: 1 + Math.random() * 1.4, a: 0.25 + Math.random() * 0.6,
    vx: (Math.random() - 0.5) * 0.004, vy: -0.002 - Math.random() * 0.006, ph: Math.random() * 6.3,
  }));

  /* --- Géométrie (remesurée au redimensionnement et à l'arrivée de la police) ---------------- */
  let W = 1, H = 1, base = 1, sol = 1.05, centres = [], dpr = 1;
  function mesurer() {
    const r = scene.getBoundingClientRect();
    W = r.width; H = r.height;
    base = 0.26 * Math.max(W, H);
    centres = jeux[0].map((l) => {
      const b = l.getBoundingClientRect();
      return { x: (b.left + b.width / 2 - r.left) / W, y: (b.top + b.height / 2 - r.top) / H };
    });
    // La rampe : sous le cadre sur grand écran, juste derrière le cartel sur mobile.
    sol = W < 700 ? (cartel.offsetTop / H) + 0.04 : 1.05;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    toile.width = Math.round(W * dpr); toile.height = Math.round(H * dpr);
  }

  /* --- État ---------------------------------------------------------------------------------- */
  const cible = { x: 0.5, y: 0.4 };
  const pos = { x: 0.5, y: 0.4 };
  const vit = { x: 0, y: 0 };
  const raideur = lent ? 0.012 : 0.05; // ressort : le faisceau a de l'inertie et dépasse légèrement
  const frein = lent ? 0.84 : 0.78;
  let dernierGeste = -1e9;
  let visible = true;
  let horloge = 0;       // secondes de séquence réellement vues (ne court pas en arrière-plan)
  let fini = false;
  let pose = false;      // la poursuite a-t-elle été placée sur la première lettre ?
  let p = 0, pCible = 0, pApplique = -1; // progression du scroll, lissée
  let boucle = 0, avant = 0;
  const mesures = [];    // durées inter-images, lues par le script de mesure

  const viser = (x, y) => {
    const r = scene.getBoundingClientRect();
    cible.x = clamp((x - r.left) / r.width);
    cible.y = clamp((y - r.top) / r.height);
    dernierGeste = performance.now();
  };
  window.addEventListener('pointermove', (e) => viser(e.clientX, e.clientY), { passive: true });
  window.addEventListener('touchmove', (e) => viser(e.touches[0].clientX, e.touches[0].clientY), { passive: true });

  function conclure() {
    if (fini) return;
    fini = true;
    toutEclairer(25);
    noir.style.opacity = 0;
    noir.style.visibility = 'hidden';
    try { sessionStorage.setItem(CLE, '1'); } catch (e) { /* idem */ }
  }

  /* --- Lever de rideau : tout découle de p (0 en haut, 1 quand la scène est quittée) --------- */
  function regler() {
    pApplique = p;
    // 1. le cartel s'efface
    const c = plage(p, 0.02, 0.1);
    cartel.style.opacity = 1 - c;
    cartel.style.transform = `translateY(${(c * 40).toFixed(1)}px)`;
    cartel.style.visibility = c === 1 ? 'hidden' : '';
    // 2. les pans s'écartent en se fronçant (ils se resserrent vers leur bord extérieur)
    const e = doux(plage(p, 0.08, 0.52));
    const pan = `scaleX(${(1 - 0.3 * e).toFixed(4)})`;
    gauche.style.transform = `translateX(${(-71 * e).toFixed(3)}%) ${pan}`;
    droite.style.transform = `translateX(${(71 * e).toFixed(3)}%) ${pan}`;
    // 3. le monogramme sort de l'ombre, puis devient l'écran.
    // Zoom exponentiel (vitesse perçue constante), départ à vitesse nulle : pas de saut entre les phases.
    const z = plage(p, 0.5, 0.95);
    const approche = 0.86 + 0.14 * doux(plage(p, 0.1, 0.52));
    mono.style.opacity = doux(plage(p, 0.1, 0.34));
    mono.style.transform = `scale(${(approche * Math.pow(zoomMax, z * z)).toFixed(4)})`;
    inondation.style.opacity = doux(plage(p, 0.89, 0.97));
  }
  const lireScroll = () => {
    const r = salle.getBoundingClientRect();
    pCible = clamp(-r.top / (r.height - window.innerHeight));
    if (!visible) { p = pCible; regler(); } // hors champ : pas de lissage à rattraper
    lancer();
  };

  /* --- Une image ----------------------------------------------------------------------------- */
  function image(t) {
    boucle = 0;
    if (avant) mesures.push(t - avant);
    if (mesures.length > 900) mesures.shift();
    const dt = avant ? Math.min(t - avant, 100) : 16.7; // plafonné : un retour d'onglet reprend la séquence, il ne la saute pas
    const n = dt / 16.7;
    avant = t;

    // Scroll lissé : la molette avance par crans, le rideau non.
    p += (pCible - p) * (1 - Math.pow(0.84, n));
    if (Math.abs(pCible - p) < 0.0004) p = pCible;
    if (p !== pApplique) regler();

    if (!fini) horloge += dt / 1000;
    const s = horloge / T;
    let nuit = 0, iris = 1, force = 0.55, chaud = 0, rampe = 0;

    if (fini) { /* salle éclairée : le faisceau n'est plus qu'un accent */ }
    else if (courte) {
      if (reste) toutEclairer(0);
      nuit = 0.8 * (1 - doux(plage(s, 0.1, COURTE)));
      if (s >= COURTE) conclure();
    } else if (s < Q.allumage) {
      // Les trois coups : la rampe respire trois fois sur le rideau nu, de plus en plus fort.
      nuit = 1; force = 0;
      for (const [quand, combien] of Q.coups) {
        const x = s - quand;
        if (x > 0) rampe += combien * (x < 0.07 ? x / 0.07 : Math.exp(-(x - 0.07) / 0.15));
      }
    } else {
      if (!pose) { pose = true; pos.x = cible.x = centres[0].x; pos.y = cible.y = centres[0].y; vit.x = vit.y = 0; }
      iris = elan(plage(s, Q.allumage, Q.allumage + 0.45));
      chaud = 1 - doux(plage(s, Q.allumage + 0.3, Q.balayage[1])); // la gélatine vire du chaud à la dominante
      nuit = 1 - doux(plage(s, Q.montee[0], Q.montee[1]));
      force = 1 - 0.45 * doux(plage(s, Q.montee[1], Q.repos));
      if (s >= Q.montee[0] && reste) toutEclairer();
      if (s >= Q.repos) conclure();
    }
    // Le scroll est aussi un variateur : descendre tôt fait monter la lumière sans attendre.
    if (!fini) {
      const parScroll = doux(plage(p, 0.02, 0.1));
      if (parScroll > 0) { nuit *= 1 - parScroll; if (reste) toutEclairer(25); }
      if (parScroll === 1) conclure();
    }

    let rx, ry, bx, by;
    if (rampe || (!fini && !courte && s < Q.allumage)) {
      bx = 0.5 * W; by = sol * H;
      rx = Math.max(1, W * (0.45 + 0.3 * rampe)); ry = Math.max(1, H * 0.52 * rampe);
    } else {
      // Cible : le geste s'il y en a un (souris, doigt), sinon le titre pendant le balayage, sinon une promenade lente.
      if (t - dernierGeste > 4000) {
        if (!fini && !courte && s < Q.balayage[1]) {
          const k = doux(plage(s, Q.balayage[0], Q.balayage[1])) * (centres.length - 1);
          const i = Math.floor(k), j = Math.min(i + 1, centres.length - 1), u = k - i;
          cible.x = centres[i].x + (centres[j].x - centres[i].x) * u;
          cible.y = centres[i].y + (centres[j].y - centres[i].y) * u;
        } else {
          const a = t / (lent ? 5200 : 3000);
          cible.x = 0.5 + 0.36 * Math.sin(a);
          cible.y = 0.4 + 0.2 * Math.sin(a * 1.7 + 1);
        }
      }
      const amorti = Math.pow(frein, n);
      vit.x = (vit.x + (cible.x - pos.x) * raideur * n) * amorti; pos.x += vit.x * n;
      vit.y = (vit.y + (cible.y - pos.y) * raideur * n) * amorti; pos.y += vit.y * n;
      // Souffle : la lampe n'est jamais parfaitement stable (respiration d'environ 8 s sur la page bien-être).
      const souffle = lent ? 1 + 0.1 * Math.sin(t / 1270) : 1 + 0.03 * Math.sin(t / 700) + 0.012 * Math.sin(t / 173);
      rx = ry = Math.max(1, base * iris * souffle * (0.82 + 0.68 * (1 - nuit))); // le cercle s'élargit avec la montée
      bx = pos.x * W; by = pos.y * H;
      // Une lettre s'installe quand le coeur du faisceau l'atteint.
      if (reste) {
        const seuil = (0.6 * rx) ** 2;
        centres.forEach((c, i) => { if (!allumees[i] && (c.x * W - bx) ** 2 + (c.y * H - by) ** 2 < seuil) eclairer(i); });
      }
    }

    const retrait = 1 - plage(p, 0.1, 0.4); // le faisceau s'éteint quand le rideau s'ouvre
    scene.style.setProperty('--bx', bx.toFixed(1) + 'px');
    scene.style.setProperty('--by', by.toFixed(1) + 'px');
    scene.style.setProperty('--brx', rx.toFixed(1) + 'px');
    scene.style.setProperty('--bry', ry.toFixed(1) + 'px');
    if (!fini) noir.style.opacity = nuit.toFixed(3);
    faisceau.style.opacity = (force * retrait).toFixed(3);
    faisceau.style.setProperty('--chaud', chaud.toFixed(3));

    // Poussière
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    const eclat = force * retrait * (0.3 + 0.7 * nuit);
    if (eclat > 0.01) {
      ctx.fillStyle = '#fff1e2';
      for (const g of grains) {
        g.x = (g.x + g.vx * n * 0.016 + 1) % 1;
        g.y = (g.y + g.vy * n * 0.016 + 1) % 1;
        const d = Math.hypot(g.x * W - bx, g.y * H - by) / rx;
        if (d >= 0.8) continue;
        ctx.globalAlpha = (1 - d / 0.8) * eclat * g.a * (0.65 + 0.35 * Math.sin(t / 900 + g.ph));
        ctx.fillRect(g.x * W, g.y * H, g.t, g.t);
      }
    }

    etat.dernier = { s: +s.toFixed(3), nuit, force, chaud, fini, p };
    lancer();
  }
  function lancer() {
    // Salle éclairée, rideau ouvert et scroll posé : plus rien à animer.
    const actif = visible && (!fini || p !== pCible || p < 0.4);
    if (!boucle && actif) boucle = requestAnimationFrame(image);
    else if (!boucle) avant = 0;
  }

  const etat = { mesures, dernier: null, etat: () => etat.dernier, lettres: () => allumees.filter(Boolean).length };
  window.__salle = etat; // lu par le filet de sécurité de la page et par les scripts de mesure

  mesurer();
  window.addEventListener('resize', () => { mesurer(); lireScroll(); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(mesurer);
  window.addEventListener('scroll', lireScroll, { passive: true });
  lireScroll();
  p = pCible;
  regler();
  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (!visible) conclure(); // scène quittée avant la fin : on la retrouvera éclairée
    lancer();
  }).observe(scene);
  lancer();
  return etat;
}
