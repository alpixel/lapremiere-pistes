// Curseur décoratif : une pastille « Ouvrir » qui suit la souris au-dessus des bandes fermées.
// Jamais requis : le curseur natif reste visible, rien n'est créé au tactile ni en mouvement réduit.

export function initCurseur() {
  const fin = matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (!fin || matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const c = document.createElement('div');
  c.className = 'curseur';
  c.setAttribute('aria-hidden', 'true');
  c.textContent = 'Ouvrir';
  document.body.append(c);

  addEventListener('pointermove', (e) => {
    c.style.translate = `${e.clientX}px ${e.clientY}px`;
    const cible = e.target.closest?.('.porte:not(.est-ouverte), .lisiere');
    c.classList.toggle('est-actif', Boolean(cible));
  }, { passive: true });
  document.addEventListener('pointerleave', () => c.classList.remove('est-actif'));
}
