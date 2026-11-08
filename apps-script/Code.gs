const RECIPIENT = 'huellasgrjuv@outlook.com';
const ALLOWED_METHODS = ['whatsapp', 'address', 'email'];
const ALLOWED_PROGRAMS = [
  'Refuerzos académicos',
  'Entrenamiento y campeonatos de microfútbol',
  'Cursos de formación general',
  'Información general de CORPOHUELLAS',
];

function doGet() {
  return HtmlService.createHtmlOutput('Servicio de recepción de CORPOHUELLAS activo.');
}

function doPost(e) {
  const token = String((e && e.parameter && e.parameter.requestToken) || '');
  let success = false;

  try {
    const request = normalizeRequest((e && e.parameter) || {});
    // Honeypot: silently acknowledge automated submissions without emailing them.
    if (!request.companyWebsite) {
      sendRequest(request);
    }
    success = true;
  } catch (error) {
    // Do not log submitted fields or error objects; they may contain personal data.
    success = false;
  }

  const safeToken = /^[a-zA-Z0-9-]{1,100}$/.test(token) ? token : '';
  const html = '<!doctype html><html><head><meta charset="utf-8"></head><body>' +
    '<script>window.top.postMessage({type:"corpohuellas-contact-result",token:' +
    JSON.stringify(safeToken) + ',success:' + (success ? 'true' : 'false') + '},"*");</script>' +
    '</body></html>';
  return HtmlService.createHtmlOutput(html)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function normalizeRequest(input) {
  const value = (key, max) => String(input[key] || '').replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, max);
  const request = {
    requestToken: value('requestToken', 100),
    companyWebsite: value('companyWebsite', 200),
    fullName: value('fullName', 160),
    contactPhone: value('contactPhone', 60),
    responseMethod: value('responseMethod', 20),
    whatsappNumber: value('whatsappNumber', 60),
    comuna: value('comuna', 100),
    neighborhood: value('neighborhood', 120),
    residenceAddress: value('residenceAddress', 240),
    addressDirections: value('addressDirections', 1000),
    responseEmail: value('responseEmail', 254),
    program: value('program', 120),
    requestDetails: value('requestDetails', 5000),
  };

  if (!/^[a-zA-Z0-9-]{1,100}$/.test(request.requestToken)) throw new Error('Invalid request.');
  if (!request.fullName || !request.contactPhone || !request.requestDetails) throw new Error('Required fields missing.');
  if (!ALLOWED_METHODS.includes(request.responseMethod)) throw new Error('Invalid response method.');
  if (!ALLOWED_PROGRAMS.includes(request.program)) throw new Error('Invalid program.');
  if (request.responseMethod === 'whatsapp' && !request.whatsappNumber) throw new Error('WhatsApp number missing.');
  if (request.responseMethod === 'address' && (!request.comuna || !request.neighborhood || !request.residenceAddress)) {
    throw new Error('Address details missing.');
  }
  if (request.responseMethod === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(request.responseEmail)) {
    throw new Error('Valid reply email missing.');
  }
  return request;
}

function sendRequest(request) {
  const methods = {
    whatsapp: 'WhatsApp',
    address: 'Dirección de residencia',
    email: 'Correo electrónico',
  };
  const lines = [
    'Nueva solicitud recibida desde la página web de CORPOHUELLAS',
    '',
    'Nombre completo: ' + request.fullName,
    'Celular de contacto: ' + request.contactPhone,
    'Medio de respuesta seleccionado: ' + methods[request.responseMethod],
  ];

  if (request.responseMethod === 'whatsapp') {
    lines.push('Número de WhatsApp: ' + request.whatsappNumber);
  } else if (request.responseMethod === 'address') {
    lines.push('Comuna: ' + request.comuna, 'Barrio: ' + request.neighborhood, 'Dirección: ' + request.residenceAddress);
    if (request.addressDirections) lines.push('Indicaciones adicionales: ' + request.addressDirections);
  } else {
    lines.push('Correo para respuesta: ' + request.responseEmail);
  }
  lines.push('', 'Programa de interés: ' + request.program, '', 'Información solicitada:', request.requestDetails);

  const options = {
    to: RECIPIENT,
    subject: 'Solicitud de información CORPOHUELLAS - ' + request.program,
    body: lines.join('\n'),
    name: 'Formulario web CORPOHUELLAS',
  };
  if (request.responseMethod === 'email') options.replyTo = request.responseEmail;
  MailApp.sendEmail(options);
}
