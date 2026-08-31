const productList = window.SOLO_MATE_PRODUCTS || [];
const detailWhatsappNumber = window.SOLO_MATE_CONFIG?.whatsapp || '';
const detailColorValues = {
  Negro: '#171717', Natural: '#d8ae78', Marrón: '#74462e', Suela: '#b87846',
  Verde: '#66816a', Azul: '#4a6f9e', Acero: '#c6ccce',
};

const root = document.querySelector('#product-detail-root');
const productId = new URLSearchParams(window.location.search).get('id');
const product = productList.find(item => item.id === productId);

function safeText(value) {
  return String(value)
    .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;').replaceAll("'", '&#039;');
}

function detailPrice(price) {
  if (price === null) return 'Consultar precio';
  return new Intl.NumberFormat('es-AR', {
    style: 'currency', currency: 'ARS', maximumFractionDigits: 0,
  }).format(price);
}

function detailTransferPrice(price) {
  if (price === null) return '<strong>10% OFF</strong> en efectivo o transferencia';
  return `<strong>${detailPrice(price * 0.9)}</strong> con transferencia`;
}

function detailImagePath(path) {
  return `${path.replace(/^images\//, 'images-square/')}?v=4`;
}

function detailWhatsappUrl(name) {
  const message = `Hola, quería consultar por ${name}. ¿Me pasan precio y disponibilidad?`;
  return `https://wa.me/${detailWhatsappNumber}?text=${encodeURIComponent(message)}`;
}

if (!product) {
  root.innerHTML = `<section class="not-found"><div><h1>Producto no encontrado</h1><a class="button button-dark" href="index.html#catalogo">Volver al catálogo</a></div></section>`;
} else {
  document.title = `${product.name} | SOLO MATE`;
  document.querySelector('meta[name="description"]').content = `${product.name}. Consultá precio y disponibilidad en SOLO MATE.`;

  const related = productList
    .filter(item => item.category === product.category && item.id !== product.id)
    .slice(0, 4);

  const colors = product.colors.length
    ? `<div class="detail-colors"><strong>Colores</strong><div class="detail-color-list">${product.colors.map(color => `<span class="detail-color"><i class="swatch" style="background:${detailColorValues[color] || '#ddd'}"></i>${safeText(color)}</span>`).join('')}</div></div>`
    : '<div class="detail-colors"><strong>Presentación</strong><div class="detail-color-list"><span class="detail-color">Según la foto</span></div></div>';

  root.innerHTML = `<section class="product-detail page-width">
    <div class="breadcrumb"><a href="index.html">Inicio</a> / <a href="index.html#catalogo">${safeText(product.category)}</a> / ${safeText(product.name)}</div>
    <div class="detail-grid">
      <div class="detail-gallery">
        <div class="detail-main-image">
          <img id="detail-main-image" src="${safeText(detailImagePath(product.images[0]))}" alt="${safeText(product.name)}">
          ${product.images.length > 1 ? `<div class="detail-gallery-controls"><button type="button" data-detail-direction="-1" aria-label="Foto anterior">←</button><button type="button" data-detail-direction="1" aria-label="Foto siguiente">→</button></div>` : ''}
        </div>
        ${product.images.length > 1 ? `<div class="detail-thumbs">${product.images.map((image, index) => `<button class="detail-thumb ${index === 0 ? 'active' : ''}" type="button" data-image-index="${index}" aria-label="Ver foto ${index + 1}"><img src="${safeText(detailImagePath(image))}" alt=""></button>`).join('')}</div>` : ''}
      </div>
      <div class="detail-info">
        <p class="detail-category">${safeText(product.category)} / ${safeText(product.subcategory)}</p>
        <h1>${safeText(product.name)}</h1>
        <strong class="detail-price">${detailPrice(product.price)}</strong>
        <p class="detail-transfer">${detailTransferPrice(product.price)}</p>
        <p class="detail-stock">Precio y stock a confirmar.</p>
        ${colors}
        <button class="button button-dark detail-cta" id="detail-whatsapp" type="button">Consultar por WhatsApp</button>
        <p class="detail-note">Cuando nos escribas, confirmamos las variantes disponibles y coordinamos la entrega.</p>
      </div>
    </div>
    ${related.length ? `<section class="related"><h2>También podés ver</h2><div class="related-grid">${related.map(item => `<a class="related-card" href="producto.html?id=${encodeURIComponent(item.id)}"><img src="${safeText(detailImagePath(item.images[0]))}" alt="${safeText(item.name)}" loading="lazy"><strong>${safeText(item.name)}</strong></a>`).join('')}</div></section>` : ''}
  </section>`;

  let detailImageIndex = 0;

  function showDetailImage(index) {
    detailImageIndex = (index + product.images.length) % product.images.length;
    document.querySelector('#detail-main-image').src = detailImagePath(product.images[detailImageIndex]);
    document.querySelectorAll('.detail-thumb').forEach((item, itemIndex) => {
      item.classList.toggle('active', itemIndex === detailImageIndex);
    });
  }

  document.querySelectorAll('.detail-thumb').forEach(button => {
    button.addEventListener('click', () => {
      showDetailImage(Number(button.dataset.imageIndex));
    });
  });

  document.querySelectorAll('[data-detail-direction]').forEach(button => {
    button.addEventListener('click', () => {
      showDetailImage(detailImageIndex + Number(button.dataset.detailDirection));
    });
  });

  const detailMedia = document.querySelector('.detail-main-image');
  let detailSwipeStart = null;

  detailMedia.addEventListener('pointerdown', event => {
    detailSwipeStart = { x: event.clientX, y: event.clientY };
  });

  detailMedia.addEventListener('pointerup', event => {
    if (!detailSwipeStart || product.images.length < 2) return;
    const deltaX = event.clientX - detailSwipeStart.x;
    const deltaY = event.clientY - detailSwipeStart.y;
    detailSwipeStart = null;
    if (Math.abs(deltaX) < 44 || Math.abs(deltaX) <= Math.abs(deltaY)) return;
    showDetailImage(detailImageIndex + (deltaX < 0 ? 1 : -1));
  });

  detailMedia.addEventListener('pointercancel', () => { detailSwipeStart = null; });

  document.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft') showDetailImage(detailImageIndex - 1);
    if (event.key === 'ArrowRight') showDetailImage(detailImageIndex + 1);
  });

  document.querySelector('#detail-whatsapp').addEventListener('click', () => {
    window.open(detailWhatsappUrl(product.name), '_blank', 'noopener,noreferrer');
  });
}

document.querySelector('#year').textContent = new Date().getFullYear();
