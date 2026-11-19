// Ouverture du rideau sur l'accueil : une seule fois par session.
//
// Script classique, chargé dans <head> AVANT les modules et sans « defer » : il doit poser ses classes
// avant la première image, sinon le visiteur verrait la bande rose ouverte, puis le rideau se refermer
// d'un coup pour se rouvrir. Un module (toujours différé) ne peut pas le garantir.
// Intégration Next.js : même code, en script en ligne dans le <head> du layout racine.
//
// Le rideau lui-même est en CSS (style.css, « Le rideau du théâtre »). Ici on ne fait que :
//   1. retenir que la session a déjà vu l'ouverture (sessionStorage), quelle que soit la page d'arrivée ;
//   2. sur la page qui la joue (<html data-ouverture>), tenir le pan fermé le temps d'une image,
//      puis le lâcher : c'est la transition ordinaire de la bande rose qui l'ouvre.
// Sans ce script, en mouvement réduit ou si le stockage est refusé : état final, aucune séquence.
// Démonstration : ajouter ?ouverture à l'adresse pour la rejouer.
(function () {
  var racine = document.documentElement;
  var CLE = 'lapremiere:ouverture';
  var ATTENTE = 250; // le rideau reste fermé un quart de seconde, le temps d'être vu
  var DUREE = 1100; // doit suivre .rideau-entree (transition-duration) dans style.css

  var dejaVue = true;
  try {
    dejaVue = sessionStorage.getItem(CLE) === '1';
    sessionStorage.setItem(CLE, '1');
  } catch (e) {
    // Stockage indisponible : on ne peut pas garantir « une seule fois », donc on ne joue pas.
  }

  if (!('ouverture' in racine.dataset)) return;
  var demo = new URLSearchParams(location.search).has('ouverture');
  if (dejaVue && !demo) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  racine.classList.add('rideau-ferme', 'rideau-entree');

  var lever = function () {
    setTimeout(function () {
      racine.classList.remove('rideau-ferme');
      // Fin de séquence par minuterie plutôt que par transitionend : si le visiteur a déjà choisi
      // une autre bande, aucune transition ne se termine et la classe resterait posée.
      setTimeout(function () { racine.classList.remove('rideau-entree'); }, DUREE + 100);
    }, ATTENTE);
  };
  // On attend que la page existe et qu'une image ait été calculée avec le pan fermé.
  var pret = function () { requestAnimationFrame(lever); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', pret);
  else pret();
})();
