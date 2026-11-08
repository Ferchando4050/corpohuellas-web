const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('.main-nav');

// Set this to the deployed Apps Script Web App URL ending in /exec.
const REQUEST_DELIVERY_CONFIG = {
  endpoint: '',
  institutionalEmail: 'huellasgrjuv@outlook.com',
};

function closeMenu() {
  navigation.classList.remove('open');
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.setAttribute('aria-label', 'Abrir menú');
}

menuButton.addEventListener('click', () => {
  const isOpen = menuButton.getAttribute('aria-expanded') === 'true';
  menuButton.setAttribute('aria-expanded', String(!isOpen));
  menuButton.setAttribute('aria-label', isOpen ? 'Abrir menú' : 'Cerrar menú');
  navigation.classList.toggle('open', !isOpen);
});

navigation.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', closeMenu);
});

document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener('click', (event) => {
    const hash = link.getAttribute('href');
    const destination = document.querySelector(hash);
    if (!destination) return;

    event.preventDefault();
    closeMenu();

    if (hash === '#top') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      const heading = destination.matches('section')
        ? destination.querySelector('h1, .section-heading h2, .contact-copy h2')
        : destination;
      const headerHeight = document.querySelector('.site-header').getBoundingClientRect().height;
      const targetTop = heading.getBoundingClientRect().top + window.scrollY - headerHeight;
      window.scrollTo({ top: targetTop, behavior: 'smooth' });
    }

    if (window.location.hash !== hash) window.history.pushState(null, '', hash);
  });
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closeMenu();
});

const sectionLinks = [...document.querySelectorAll('.main-nav a[href^="#"]')];
const sections = sectionLinks.map((link) => document.querySelector(link.getAttribute('href'))).filter(Boolean);
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    sectionLinks.forEach((link) => {
      const selected = link.getAttribute('href') === `#${entry.target.id}`;
      link.classList.toggle('active', selected);
      if (selected) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  });
}, { rootMargin: '-35% 0px -55% 0px' });
sections.forEach((section) => observer.observe(section));

document.querySelectorAll('.video-load-button[data-youtube-id]').forEach((button) => {
  button.addEventListener('click', () => {
    const player = document.createElement('iframe');
    player.src = `https://www.youtube.com/embed/${encodeURIComponent(button.dataset.youtubeId)}`;
    player.title = button.getAttribute('aria-label').replace(/^Reproducir video\s*/i, '');
    player.loading = 'lazy';
    player.referrerPolicy = 'strict-origin-when-cross-origin';
    player.allow = 'accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    player.allowFullscreen = true;
    button.closest('.video-placeholder').replaceChildren(player);
  });
});

document.querySelector('#year').textContent = new Date().getFullYear();

const requestDialog = document.querySelector('#request-dialog');
const requestForm = document.querySelector('#request-form');
const openRequestDialog = document.querySelector('#open-request-dialog');
const formFeedback = document.querySelector('#form-feedback');
const responseRadios = [...requestForm.querySelectorAll('input[name="responseMethod"]')];
const responseFields = [...requestForm.querySelectorAll('[data-response-fields]')];

openRequestDialog.addEventListener('click', () => {
  requestDialog.showModal();
});

requestDialog.querySelectorAll('[data-close-dialog]').forEach((button) => {
  button.addEventListener('click', () => requestDialog.close());
});

function updateResponseFields() {
  const selectedMethod = responseRadios.find((radio) => radio.checked)?.value;
  responseFields.forEach((group) => {
    const isActive = group.dataset.responseFields === selectedMethod;
    group.hidden = !isActive;
    group.querySelectorAll('input, textarea').forEach((field) => {
      field.disabled = !isActive;
      field.required = isActive && field.id !== 'address-directions';
    });
  });
  formFeedback.classList.remove('is-visible');
}

responseRadios.forEach((radio) => radio.addEventListener('change', updateResponseFields));

requestDialog.addEventListener('click', (event) => {
  if (event.target === requestDialog) requestDialog.close();
});

requestForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!requestForm.reportValidity()) {
    formFeedback.textContent = 'Completa los campos obligatorios señalados para enviar la solicitud.';
    formFeedback.classList.add('is-visible');
    return;
  }

  const values = new FormData(requestForm);
  const methodLabels = {
    whatsapp: 'Por WhatsApp',
    address: 'A la dirección de residencia',
    email: 'Por correo electrónico',
  };
  const responseMethod = values.get('responseMethod');
  const details = [
    ['Nombre completo', values.get('fullName')],
    ['Celular de contacto', values.get('contactPhone')],
    ['Medio de respuesta preferido', methodLabels[responseMethod]],
  ];

  if (responseMethod === 'whatsapp') {
    details.push(['Número de WhatsApp', values.get('whatsappNumber')]);
  } else if (responseMethod === 'address') {
    details.push(
      ['Comuna', values.get('comuna')],
      ['Barrio', values.get('neighborhood')],
      ['Dirección', values.get('residenceAddress')],
    );
    if (values.get('addressDirections')) details.push(['Indicaciones adicionales', values.get('addressDirections')]);
  } else if (responseMethod === 'email') {
    details.push(['Correo para respuesta', values.get('responseEmail')]);
  }

  details.push(
    ['Programa de interés', values.get('program')],
    ['Información solicitada', values.get('requestDetails')],
  );

  const requestToken = (window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`).replace(/[^a-zA-Z0-9-]/g, '');
  const payload = {
    requestToken,
    fullName: values.get('fullName'),
    contactPhone: values.get('contactPhone'),
    responseMethod,
    whatsappNumber: responseMethod === 'whatsapp' ? values.get('whatsappNumber') : '',
    comuna: responseMethod === 'address' ? values.get('comuna') : '',
    neighborhood: responseMethod === 'address' ? values.get('neighborhood') : '',
    residenceAddress: responseMethod === 'address' ? values.get('residenceAddress') : '',
    addressDirections: responseMethod === 'address' ? values.get('addressDirections') : '',
    responseEmail: responseMethod === 'email' ? values.get('responseEmail') : '',
    program: values.get('program'),
    requestDetails: values.get('requestDetails'),
    companyWebsite: '',
  };
  const submitButton = requestForm.querySelector('button[type="submit"]');

  if (!REQUEST_DELIVERY_CONFIG.endpoint || !REQUEST_DELIVERY_CONFIG.institutionalEmail) {
    formFeedback.textContent = 'El envío requiere la URL de la Web App de recepción. Consulta CONFIGURACION_CONTACTO.md para completar la conexión.';
    formFeedback.classList.add('is-visible');
    return;
  }

  submitButton.disabled = true;
  formFeedback.textContent = 'Enviando tu solicitud…';
  formFeedback.classList.add('is-visible');

  let hiddenForm;
  let responseFrame;
  let timeoutId;
  let onResult;
  const cleanup = () => {
    if (onResult) window.removeEventListener('message', onResult);
    window.clearTimeout(timeoutId);
    hiddenForm?.remove();
    responseFrame?.remove();
  };

  try {
    const result = await new Promise((resolve, reject) => {
      responseFrame = document.createElement('iframe');
      responseFrame.name = `corpohuellas-response-${requestToken}`;
      responseFrame.title = 'Confirmación del envío del formulario';
      responseFrame.setAttribute('aria-hidden', 'true');
      responseFrame.style.cssText = 'position:fixed;width:1px;height:1px;left:-10000px;top:0;border:0';
      document.body.append(responseFrame);

      onResult = (messageEvent) => {
        if (messageEvent.source !== responseFrame.contentWindow) return;
        const data = messageEvent.data;
        if (!data || data.type !== 'corpohuellas-contact-result' || data.token !== requestToken) return;
        if (data.success === true) resolve(data);
        else reject(new Error('El servicio no pudo enviar el mensaje.'));
      };
      window.addEventListener('message', onResult);
      timeoutId = window.setTimeout(() => reject(new Error('Tiempo de espera agotado.')), 45000);

      hiddenForm = document.createElement('form');
      hiddenForm.method = 'POST';
      hiddenForm.action = REQUEST_DELIVERY_CONFIG.endpoint;
      hiddenForm.enctype = 'application/x-www-form-urlencoded';
      hiddenForm.target = responseFrame.name;
      hiddenForm.hidden = true;
      Object.entries(payload).forEach(([name, value]) => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = name;
        input.value = value ?? '';
        hiddenForm.append(input);
      });
      document.body.append(hiddenForm);
      HTMLFormElement.prototype.submit.call(hiddenForm);
    });
    requestForm.reset();
    updateResponseFields();
    formFeedback.textContent = 'Tu solicitud fue recibida por CORPOHUELLAS.';
    formFeedback.classList.add('is-visible');
  } catch {
    formFeedback.textContent = 'No pudimos transmitir tu solicitud. Inténtalo de nuevo más tarde.';
  } finally {
    cleanup();
    submitButton.disabled = false;
  }
});
