// =====================================================================
// Configuración del sitio — edita aquí los datos de tu boda
// =====================================================================
const SITE_CONFIG = {
  // Conexión a Supabase (no cambiar salvo que crees un proyecto nuevo)
  supabaseUrl: "https://mofvhphzzkpnscyrmhun.supabase.co",
  supabaseKey: "sb_publishable_3GvY_F4orCNUdt19O6GEGg_uV7BrK67",

  // Textos de la invitación — personaliza libremente
  novios: "Alexander & Karen",
  fecha: "2026-11-14T15:30:00-05:00", // fecha y hora de la ceremonia (cuenta regresiva)
  fechaTexto: "14 de noviembre de 2026",
  lugarCeremonia: "Capilla Santa Helena — 3:30pm",
  lugarRecepcion: "Salón social El Bosque — 5:00pm",
  dressCode: "Formal. Colores reservados: marrón chocolate, dorado, oro rosa y beige champagne.",
  mensajeBienvenida:
    "Con todo nuestro cariño, queremos que nos acompañes en el día más importante de nuestras vidas.",

  // Enlaces del diseño (extraídos del Canva de la invitación)
  mapaCeremonia: "https://maps.app.goo.gl/DeDK6q5VrtJnNvgo6",
  mapaRecepcion: "https://maps.app.goo.gl/DeDK6q5VrtJnNvgo6",
  cancionUrl: "https://www.youtube.com/watch?v=Rir_fuLX7HM",
  albumUrl: "https://www.piczigo.com/join?code=476ACE",
};

const supabaseClient = window.supabase.createClient(
  SITE_CONFIG.supabaseUrl,
  SITE_CONFIG.supabaseKey
);
