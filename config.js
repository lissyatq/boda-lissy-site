// =====================================================================
// Configuración del sitio — edita aquí los datos de tu boda
// =====================================================================
const SITE_CONFIG = {
  // Conexión a Supabase (no cambiar salvo que crees un proyecto nuevo)
  supabaseUrl: "https://mofvhphzzkpnscyrmhun.supabase.co",
  supabaseKey: "sb_publishable_3GvY_F4orCNUdt19O6GEGg_uV7BrK67",

  // Textos de la invitación — personaliza libremente
  novios: "Nombre & Nombre",
  fecha: "2027-06-12T16:00:00", // formato AAAA-MM-DDTHH:MM:SS, hora local del evento
  fechaTexto: "12 de junio de 2027",
  lugarCeremonia: "Nombre del lugar de la ceremonia",
  lugarRecepcion: "Nombre del lugar de la recepción",
  dressCode: "Formal / Elegante",
  mensajeBienvenida:
    "Con todo nuestro cariño, queremos que nos acompañes en el día más importante de nuestras vidas.",

  // Imagen de portada: reemplaza por tu diseño de Canva.
  // Exporta tu diseño de Canva como imagen (PNG/JPG) y súbela junto a
  // estos archivos con el nombre "portada.jpg" — se usará automáticamente.
  // Mientras tanto se muestra un diseño de reemplazo (placeholder).
  imagenPortada: "portada.jpg",
};

const supabaseClient = window.supabase.createClient(
  SITE_CONFIG.supabaseUrl,
  SITE_CONFIG.supabaseKey
);
