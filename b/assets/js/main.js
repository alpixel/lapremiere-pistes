// Point d'entrée : chaque module est indépendant et purement décoratif
// (le contenu reste lisible si l'un d'eux échoue).
import { initEmpreintes } from './empreintes.js';
import { initPresse } from './presse.js';
import { initAffiches } from './affiches.js';
import { initTrace } from './trace.js';

const mouvementReduit = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

initMenu();
initFormulaire();
initEmpreintes();
initPresse();
initAffiches();
if (!mouvementReduit) initTrace();

/** Menu mobile : simple bascule, fermée par Échap ou par un clic sur un lien. */
function initMenu() {
  const bouton = document.querySelector('.nav__menu');
  const liste = document.getElementById('menu');
  if (!bouton || !liste) return;
  const basculer = (ouvert) => {
    liste.classList.toggle('est-ouvert', ouvert);
    bouton.setAttribute('aria-expanded', String(ouvert));
  };
  bouton.addEventListener('click', () => basculer(!liste.classList.contains('est-ouvert')));
  liste.addEventListener('click', (e) => { if (e.target.closest('a')) basculer(false); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && liste.classList.contains('est-ouvert')) { basculer(false); bouton.focus(); }
  });
}

/** Formulaire en maquette : aucun envoi, on l'annonce clairement. */
function initFormulaire() {
  const form = document.querySelector('[data-maquette]');
  if (!form) return;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    form.querySelector('.formulaire__etat').textContent = 'Maquette : aucune donnée n’a été envoyée.';
  });
}
