import { initPortes } from './portes.js';
import { decouper, initEtirement } from './cinetique.js';
import { initCurseur } from './curseur.js';

decouper();
initPortes();
initEtirement();
initCurseur();

// Les formulaires sont des maquettes : aucun envoi.
document.querySelectorAll('form[data-maquette]').forEach((f) => {
  f.addEventListener('submit', (e) => {
    e.preventDefault();
    f.querySelector('[role="status"]').textContent = 'Maquette : aucune donnée n’a été envoyée.';
  });
});
