// Content of the questionnaire (Spanish). Plain ES module with no DOM access, so the browser (app.js) and Node (export.mjs)
// share the variable names. Variable names follow the shared design document of E2.
import timeline from './timeline.js';

export const SCALE = ['Totalmente en desacuerdo', 'En desacuerdo', 'Ni de acuerdo ni en desacuerdo', 'De acuerdo', 'Totalmente de acuerdo'];
export const NA = 'No lo sé / no se vio en el vídeo';

// Moments of the video (seconds), taken from the video's own timeline.
const T = id => timeline[id].start;
export const CHAPTERS = [
  ['El problema', T('q0')], ['Nuestra propuesta', T('pr')], ['Los 8 mecanismos', T('p')], ['Demostración', T('s1')], ['Resumen', T('r')],
];
export const MOMENTS = {
  chat: { t: T('q1'), len: 24 }, modelau: { t: T('s7'), len: 20 },
  cite: { t: T('s7') + 10, len: 12 }, highlight: { t: T('s8'), len: 15 }, single: { t: T('s7'), len: 14 },
  cap: { t: T('s10'), len: 16 }, nudge: { t: T('s2'), len: 12 }, edit: { t: T('s4'), len: 13 },
  step: { t: T('s1'), len: 14 }, vocab: { t: T('s9'), len: 20 }, integrated: { t: T('s5'), len: 14 },
};

export const NO_MODELAU_USE = 'No lo he usado';

export const PART0 = [
  { id: 'exp_years', q: '¿Cuántos años llevas enseñando UML o modelado?', type: 'choice', options: ['0 a 2', '3 a 5', '6 a 10', 'Más de 10'] },
  { id: 'courses', q: '¿En qué asignaturas enseñas o has enseñado UML o modelado?', type: 'text' },
  { id: 'university', q: '¿En qué universidad enseñas o has enseñado UML o modelado?', type: 'text' },
  { id: 'ai_use', q: '¿Has usado asistentes de IA (chats) en tu docencia?', type: 'choice', options: ['Nunca', 'Alguna vez', 'Habitualmente'] },
  { id: 'watched', q: '¿Has visto el vídeo completo?', type: 'choice', options: ['Entero', 'La mayor parte', 'Solo una parte'] },
  { id: 'modelau_use', q: '¿Cómo has usado ModelaU?', type: 'choice',
    options: [NO_MODELAU_USE, 'Lo he explorado sin trabajar en un ejercicio', 'Lo he usado para trabajar en un ejercicio', 'Lo he usado para trabajar en varios ejercicios'] },
  { id: 'modelau_experience', q: 'Si has usado ModelaU, describe tu experiencia.', type: 'text', optional: true },
];

// Nicol's four feedback-quality dimensions, as defined in the paper (kernel theory), in plain Spanish.
export const DIMS = {
  'Específica': { adj: 'sea específica', def: 'señala la parte exacta del trabajo del estudiante a la que se refiere (por ejemplo, una clase, una relación o un paso concreto de su diagrama), en lugar de hacer comentarios generales como «revisa tu diagrama»', why: 'Así el estudiante sabe dónde mirar y qué revisar, en lugar de tener que adivinarlo.' },
  'Selectiva': { adj: 'sea selectiva', def: 'se centra en un único problema por interacción, el más importante en ese momento, en lugar de enumerar a la vez todos los que se podrían señalar', why: 'Así el estudiante puede atender cada comentario sin abrumarse con más de lo que puede abordar de una vez.' },
  'A tiempo': { adj: 'llegue a tiempo', def: 'llega mientras el intento del estudiante sigue en marcha (por ejemplo, cuando parece atascado o comete un error estructural), y no solo cuando lo pide de forma explícita, que puede ser demasiado tarde', why: 'Así sigue siendo útil mientras el estudiante está motivado y todavía puede corregir su trabajo.' },
  'Contextualizada': { adj: 'sea contextualizada', def: 'se adapta al paso o etapa de la tarea en que está el estudiante (por ejemplo, identificar clases o definir relaciones), sin imponer un orden obligatorio entre etapas', why: 'Así el estudiante relaciona la ayuda con su propio progreso y no con una lista abstracta de consejos.' },
};

// Part A: each statement is rated twice, once for ModelaU and once for the conventional chat (suffixes _mu and _chat).
export const A = [
  ['specific', 'Específica', DIMS['Específica'].def],
  ['selective', 'Selectiva', DIMS['Selectiva'].def],
  ['timely', 'A tiempo', DIMS['A tiempo'].def],
  ['context', 'Contextualizada', DIMS['Contextualizada'].def],
].map(([key, label, text]) => ({ key, label, text }));

// Part B: the eight mechanisms. `rel` is completed with the dimension the mechanism targets.
export const B = [
  { key: 'cite', name: 'Citar los nombres exactos', dim: 'Específica', img: 'cite.png', moment: 'cite', live: true,
    what: 'El tutor se refiere a los elementos del trabajo del estudiante (clases, atributos, actores o casos de uso) con el nombre exacto que tienen en su diagrama, en lugar de expresiones vagas como «esa clase» o «esa relación». La idea es que el estudiante sepa sin dudas de qué parte de su trabajo le hablan.',
    see: 'En el vídeo, la respuesta habla de «Member» y «GymClass», tal como se llaman en el diagrama, no de «esa relación».' },
  { key: 'highlight', name: 'Señalado validado en el diagrama', dim: 'Específica', img: 'highlight.png', moment: 'highlight', live: true,
    what: 'Cuando el tutor menciona elementos del diagrama, la interfaz los recuadra para que el estudiante los localice de un vistazo. Antes de recuadrarlos, el servidor comprueba que existen de verdad en el diagrama, así que nunca se señala algo inventado por el modelo.',
    see: 'Al pulsar «Show in diagram», los elementos de los que habla el tutor se recuadran en azul. Si el modelo se inventara uno, no se marcaría.' },
  { key: 'single', name: 'Un solo problema por respuesta', dim: 'Selectiva', img: 'single.png', moment: 'single', live: true,
    what: 'Cada respuesta se centra en un único problema, el más relevante en ese momento, y termina con una pregunta; los demás posibles problemas esperan a las siguientes interacciones. La idea es que el estudiante pueda atender el comentario sin abrumarse con una lista de correcciones.',
    see: 'La respuesta es corta, trata una sola cosa y termina con una pregunta; no dice qué hay que añadir.' },
  { key: 'cap', name: 'Como mucho tres señalados por respuesta', dim: 'Selectiva', img: 'cap.png', moment: 'cap', live: true,
    what: 'La interfaz recuadra como mucho tres elementos del diagrama por respuesta, aunque el problema afecte a más. Las marcas sirven de ejemplo: el estudiante ve unas pocas y puede ser quien encuentre las demás, en lugar de recibir todo señalado. La idea es no darle más de lo que puede abordar de una vez; el mensaje del tutor puede nombrar más elementos, pero solo se marcan tres.',
    see: 'Con un diagrama más avanzado, el estudiante pide que le muestre todas las clases que repiten datos. El modelo propuso cuatro (también Newcomer), pero solo se recuadran Member, Trainer y Receptionist; la cuarta queda para que la encuentre el estudiante.' },
  { key: 'nudge', name: 'Aviso por inactividad', dim: 'A tiempo', img: 'nudge.png', moment: 'nudge', live: true,
    what: 'Si el estudiante lleva unos minutos sin actividad y el diagrama sigue incompleto, junto al tutor aparece un bocadillo que le ofrece ayuda, sin abrir nada por su cuenta. La idea es llegar a quien se ha atascado antes de que abandone, sin interrumpir a quien solo está pensando.',
    see: 'En el vídeo se acelera el tiempo: junto a UMLBuddy aparece «Feeling stuck? I can help you move on…». No abre nada por sí solo y desaparece en cuanto el estudiante edita.' },
  { key: 'edit_checks', name: 'Comprobaciones al editar', dim: 'A tiempo', img: 'edit.png', moment: 'edit', live: true,
    what: 'Mientras el estudiante edita, un conjunto de reglas comprueba problemas estructurales (por ejemplo, una relación sin multiplicidad) y los marca al instante, sin consultar al modelo de lenguaje. La idea es avisar del error en el momento en que se comete, sin esperar a que el estudiante pregunte.',
    see: 'La relación «books» no tiene multiplicidad y aparece un aviso (!) enseguida. Lo hace un programa, no el modelo de lenguaje.' },
  { key: 'step', name: 'Detección del paso del proceso', dim: 'Contextualizada', img: 'step.png', moment: 'step', live: true,
    what: 'La herramienta deduce, a partir del diagrama del estudiante, en qué paso del modelado se encuentra (por ejemplo, identificar clases o definir relaciones) y adapta las pistas a ese paso, sin imponer un orden. La idea es que la pista sea la que toca en ese momento y no un consejo genérico; el estudiante puede corregir el paso a mano.',
    see: 'El selector «Process step» muestra en qué paso cree la herramienta que está el estudiante, deducido solo de su diagrama. Puede cambiarlo a mano.' },
  { key: 'vocab', name: 'Vocabulario compartido de resaltados', dim: 'Contextualizada', img: 'vocab.png', moment: 'vocab', live: true,
    what: 'Los fragmentos del enunciado que menciona el tutor se colorean según su tipo (requisito, actor, por aclarar) y se subrayan si todavía no están en el diagrama. La idea es que el estudiante vea, sobre el propio enunciado, qué le falta por modelar.',
    see: 'La frase del enunciado que señala el tutor se colorea según su tipo (requisito, actor, por aclarar) y se subraya porque todavía no tiene reflejo en el diagrama.' },
];
export const B_INTEGRATED = { key: 'integrated', img: 'integrated.png', moment: 'integrated',
  text: 'Que el tutor esté dentro del espacio de diseño, sin copiar el diagrama y el enunciado en otro chat, es útil para el estudiante.',
  see: 'El tutor se abre junto al formulario, el diagrama y el enunciado, y ya ve los tres: el estudiante no copia nada.' };
export const B_INTR = 'Este mecanismo estorbaría al estudiante mientras modela.';

export const C = [
  ['relative', 'Preferiría que mis estudiantes usaran ModelaU antes que un chat generalista para estos ejercicios.'],
  ['useful', 'Usar ModelaU mejoraría el aprendizaje de modelado de mis estudiantes.'],
  ['complex', 'Los mecanismos de ModelaU son fáciles de entender.'],
  ['compat', 'ModelaU encaja con mi forma de enseñar modelado.'],
  ['intent', 'Probaría ModelaU en una de mis asignaturas.'],
  ['worry', 'Me preocupa que los estudiantes dependan de la herramienta en lugar de pensar.'],
].map(([key, text]) => ({ key, text }));

export const D = [
  { id: 'D_liked', q: '¿Qué cosas te han gustado de ModelaU?', type: 'text' },
  { id: 'D_disliked', q: '¿Qué cosas no te han gustado de ModelaU?', type: 'text' },
  { id: 'D_comments', q: 'Para dejar tus comentarios', type: 'text' },
];

// Ordered list of every stored variable (used for the CSV header).
export const VARIABLES = [
  ...PART0.map(p => p.id),
  ...A.flatMap(a => [`A_${a.key}_mu`, `A_${a.key}_chat`]),
  ...B.flatMap(b => [`B_${b.key}_rel`, `B_${b.key}_intr`]),
  'B_integrated',
  ...C.map(c => `C_${c.key}`),
  ...D.map(d => d.id),
  // Mechanism 4 was 'one scenario at a time' (sequence diagrams) until 2026-11-10; responses sent before then rated it here.
  'B_scenario_rel', 'B_scenario_intr',
];
