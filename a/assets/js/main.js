// Point d'entrée. Sans ce script la page reste complète : rideau fermé et éclairé, contenu lisible.
// Le noir initial est posé par un court script en ligne dans <head> (classe « conduite »), avant la première image.
import { initSalle } from './salle.js';
import { initPoles } from './poles.js';

const reduit = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Si la conduite lumière échoue, on rallume : la lecture ne dépend jamais de l'effet.
try { initSalle({ reduit }); } catch (e) { document.documentElement.classList.remove('conduite', 'scenique'); console.error(e); }
initPoles({ reduit });

// Menu mobile
const nav = document.querySelector('.nav');
const menu = nav.querySelector('.nav__menu');
const fermer = () => { nav.classList.remove('is-ouverte'); menu.setAttribute('aria-expanded', 'false'); };
menu.addEventListener('click', () => {
  const ouverte = nav.classList.toggle('is-ouverte');
  menu.setAttribute('aria-expanded', String(ouverte));
});
nav.querySelectorAll('.nav__liens a').forEach((a) => a.addEventListener('click', fermer));
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') fermer(); });

// Titres d'acte : entrée par le bas quand l'acte arrive à l'écran
const vus = new IntersectionObserver((es) => {
  es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('est-vu'); vus.unobserve(e.target); } });
}, { rootMargin: '0px 0px -15% 0px' });
document.querySelectorAll('.acte').forEach((a) => vus.observe(a));

// Formulaires : maquettes, aucun envoi
document.querySelectorAll('form[data-maquette]').forEach((f) => {
  f.addEventListener('submit', (e) => {
    e.preventDefault();
    f.querySelector('[role="status"]').textContent = 'Maquette : aucune donnée n’a été envoyée.';
  });
});
