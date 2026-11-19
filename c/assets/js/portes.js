// Les trois portes : survol, focus ou toucher ouvre une bande ; le clic sur une bande ouverte navigue.
// Sans JS, la bande du pôle courant est ouverte dans le HTML et chaque bande reste un lien ordinaire.

export function initPortes() {
  const portes = document.querySelector('.portes');
  if (!portes) return;

  const defaut = portes.dataset.ouvert; // pôle de la page
  const bandes = [...portes.querySelectorAll('.porte')];

  const ouvrir = (pole) => {
    if (portes.dataset.ouvert === pole) return;
    portes.dataset.ouvert = pole;
    // L'accent pilote la couleur du monogramme et du lien de navigation (option A de l'identité)
    document.body.dataset.accent = pole;
    bandes.forEach((b) => b.classList.toggle('est-ouverte', b.dataset.pole === pole));
  };

  bandes.forEach((bande) => {
    const pole = bande.dataset.pole;
    const lien = bande.querySelector('.porte__lien');

    // Souris uniquement : au tactile, pointerenter précède le clic et empêcherait le « premier toucher = ouvrir »
    bande.addEventListener('pointerenter', (e) => {
      if (e.pointerType === 'mouse') ouvrir(pole);
    });
    lien.addEventListener('focus', () => ouvrir(pole));

    // Tactile : un premier toucher ouvre le tiroir, le second suit le lien
    // L'état est relevé au pointerdown : le focus (qui ouvre la bande) arrive avant le clic
    let toucheFermee = false;
    lien.addEventListener('pointerdown', (e) => {
      toucheFermee = e.pointerType !== 'mouse' && !bande.classList.contains('est-ouverte');
    });
    lien.addEventListener('click', (e) => {
      if (toucheFermee) {
        e.preventDefault();
        ouvrir(pole);
      }
      toucheFermee = false;
    });
  });

  // En quittant le héros à la souris, la page retrouve sa dominante
  portes.addEventListener('pointerleave', (e) => {
    if (e.pointerType === 'mouse') ouvrir(defaut);
  });
}
