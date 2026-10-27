/* Catálogo de filtros inspirado en la estructura de CapCut 9.6 (categorías y nombres).
   Las mezclas de color son propias: se generan con filtros CSS a partir de perfiles
   por categoría, de modo que cada entrada tiene un aspecto reproducible y distinto. */

export const CAPCUT_FILTER_CATEGORIES = [
  'Destacado',
  'Halloween',
  'NUEVO',
  'Bombazos',
  'Vida',
  'Paisaje',
  'Retrato',
  'Blanco y negro',
  'Películas',
  'Retro',
  'Herramientas',
  'Alternativo',
  'Noche',
  'Filtro frío',
  'Filtro cálido',
  'Comida',
  'Cabina fotográfica',
  'CCD',
  'Mascotas',
];

/* Perfiles de color: [saturación, contraste, brillo, tono, sepia, gris, desenfoque] */
const PROFILES = {
  'Destacado': [
    [1.38, 1.08, 1.03, -6, 0.03, 0, 0],
    [1.14, 1.04, 1.05, -12, 0.18, 0, 0],
    [1.12, 1.13, 0.99, 8, 0.08, 0, 0],
    [0.95, 0.98, 1.07, 0, 0.1, 0, 0],
    [1.5, 1.14, 1.0, -3, 0.02, 0, 0],
    [0.86, 1.1, 1.02, 14, 0.14, 0, 0],
  ],
  'Halloween': [
    [1.22, 1.18, 0.86, -18, 0.22, 0, 0],
    [0.92, 1.2, 0.9, 96, 0.12, 0, 0],
    [1.12, 1.16, 0.82, -42, 0.28, 0, 0],
    [0.78, 1.12, 0.9, 186, 0.14, 0, 0],
    [1.3, 1.22, 0.88, 54, 0.1, 0, 0],
    [1.05, 1.1, 1.02, -8, 0.34, 0, 0.2],
  ],
  'NUEVO': [
    [1.3, 1.06, 1.06, 6, 0.04, 0, 0],
    [1.08, 0.98, 1.08, -10, 0.12, 0, 0],
    [1.18, 1.1, 1.02, 24, 0.03, 0, 0],
    [0.98, 1.02, 1.09, -24, 0.08, 0, 0],
    [1.42, 1.12, 1.0, -4, 0.02, 0, 0],
  ],
  'Bombazos': [
    [1.55, 1.12, 1.02, -4, 0.02, 0, 0],
    [1.4, 1.16, 0.98, 10, 0.05, 0, 0],
    [1.62, 1.08, 1.05, -12, 0.03, 0, 0],
    [1.35, 1.2, 0.96, 20, 0.04, 0, 0],
  ],
  'Vida': [
    [1.18, 1.03, 1.07, -6, 0.12, 0, 0],
    [1.06, 0.98, 1.1, 4, 0.08, 0, 0],
    [1.28, 1.05, 1.04, -12, 0.16, 0, 0],
    [0.96, 0.96, 1.12, 0, 0.06, 0, 0],
    [1.12, 1.02, 1.02, 32, 0.05, 0, 0],
  ],
  'Paisaje': [
    [1.38, 1.08, 1.03, -8, 0.02, 0, 0],
    [1.5, 1.12, 1.0, 18, 0.01, 0, 0],
    [1.28, 1.05, 1.06, -18, 0.05, 0, 0],
    [1.2, 1.0, 1.08, 120, 0.02, 0, 0],
    [1.45, 1.1, 0.98, 190, 0.03, 0, 0],
  ],
  'Retrato': [
    [1.14, 1.02, 1.06, -8, 0.12, 0, 0],
    [1.06, 1.0, 1.09, -4, 0.08, 0, 0],
    [1.2, 1.06, 1.03, -14, 0.2, 0, 0],
    [0.94, 0.98, 1.1, 6, 0.06, 0, 0],
    [1.08, 1.04, 1.04, 350, 0.1, 0, 0],
  ],
  'Blanco y negro': [
    [1, 1.08, 1, 0, 0, 1, 0],
    [1, 1.3, 0.92, 0, 0, 1, 0],
    [1, 0.94, 1.1, 0, 0, 1, 0],
    [1, 1.18, 0.86, 0, 0.12, 1, 0],
    [1, 1.02, 1.04, 0, 0, 1, 0.3],
  ],
  'Películas': [
    [1.06, 1.14, 0.99, -8, 0.14, 0, 0],
    [1.02, 1.08, 1.02, 12, 0.08, 0, 0],
    [0.96, 1.12, 0.96, 180, 0.1, 0, 0],
    [1.12, 1.18, 0.94, -18, 0.18, 0, 0],
    [0.9, 1.04, 1.04, 4, 0.06, 0, 0],
  ],
  'Retro': [
    [0.88, 0.96, 1.05, -10, 0.34, 0, 0],
    [0.82, 0.92, 1.08, -4, 0.42, 0, 0],
    [0.96, 1.0, 1.02, 16, 0.26, 0, 0],
    [0.76, 0.9, 1.1, 0, 0.5, 0, 0.3],
    [1.02, 1.04, 1.0, -20, 0.3, 0, 0],
  ],
  'Herramientas': [
    [1.06, 1.1, 1.04, 0, 0, 0, 0],
    [1.1, 1.06, 1.06, -4, 0.02, 0, 0],
    [1.02, 1.14, 1.02, 4, 0, 0, 0],
    [1.14, 1.08, 1.03, -8, 0.03, 0, 0],
  ],
  'Alternativo': [
    [1.3, 1.12, 1.0, 288, 0.1, 0, 0],
    [1.2, 1.08, 1.02, 148, 0.06, 0, 0],
    [1.45, 1.18, 0.96, 230, 0.04, 0, 0],
    [0.9, 1.14, 0.94, -60, 0.2, 0, 0.2],
    [1.6, 1.06, 1.04, 320, 0.02, 0, 0],
    [1.05, 1.0, 1.08, 60, 0.14, 0, 0],
  ],
  'Noche': [
    [1.1, 1.16, 0.9, 190, 0.06, 0, 0],
    [1.25, 1.2, 0.86, 220, 0.04, 0, 0],
    [0.95, 1.12, 0.92, 172, 0.1, 0, 0],
    [1.35, 1.22, 0.88, 268, 0.03, 0, 0],
    [1.02, 1.1, 0.94, -30, 0.14, 0, 0],
  ],
  'Filtro frío': [
    [0.98, 1.04, 1.04, 14, 0.02, 0, 0],
    [0.9, 1.02, 1.06, 22, 0, 0, 0],
    [1.06, 1.06, 1.02, 6, 0.03, 0, 0],
    [0.86, 1.0, 1.08, 30, 0, 0, 0],
    [1.12, 1.08, 1.0, -2, 0.02, 0, 0],
  ],
  'Filtro cálido': [
    [1.12, 1.04, 1.05, -10, 0.22, 0, 0],
    [1.2, 1.06, 1.03, -16, 0.28, 0, 0],
    [1.04, 1.0, 1.08, -6, 0.16, 0, 0],
    [1.28, 1.1, 1.0, -20, 0.34, 0, 0],
    [0.96, 0.98, 1.1, -2, 0.12, 0, 0],
  ],
  'Comida': [
    [1.44, 1.06, 1.05, -4, 0.06, 0, 0],
    [1.3, 1.1, 1.03, 6, 0.1, 0, 0],
    [1.52, 1.02, 1.07, -10, 0.04, 0, 0],
    [1.24, 1.08, 1.0, 18, 0.08, 0, 0],
    [1.38, 1.04, 1.08, 0, 0.12, 0, 0],
  ],
  'Cabina fotográfica': [
    [0.92, 0.98, 1.04, -8, 0.32, 0, 0],
    [0.86, 0.94, 1.08, 0, 0.4, 0, 0],
    [1.02, 1.02, 1.0, -14, 0.26, 0, 0],
    [0.8, 0.9, 1.1, 8, 0.48, 0, 0.3],
    [1.06, 1.06, 1.02, -20, 0.2, 0, 0],
  ],
  'CCD': [
    [1.3, 1.2, 1.02, -4, 0.02, 0, 0.2],
    [1.18, 1.14, 1.05, 8, 0.04, 0, 0.15],
    [1.42, 1.18, 0.98, -10, 0.03, 0, 0.25],
    [1.06, 1.1, 1.06, 0, 0.08, 0, 0.1],
    [1.34, 1.24, 1.0, 14, 0.02, 0, 0.2],
  ],
  'Mascotas': [
    [1.22, 1.02, 1.06, -6, 0.06, 0, 0],
    [1.12, 1.0, 1.08, 4, 0.1, 0, 0],
    [1.3, 1.04, 1.04, -12, 0.08, 0, 0],
    [1.0, 0.98, 1.1, 0, 0.04, 0, 0],
    [1.18, 1.06, 1.02, 20, 0.06, 0, 0],
  ],
};

const SEEDS = {
  'Destacado': [
    'Saturación audaz', 'Atardecer universal', 'Retro americano', 'Moka en la calle',
    'Misión de amor', 'Cian rojo', 'CCD con flash', 'Trigo mate', 'Lienzo brumoso',
    'Terror sereno', 'Luces nocturnas', 'Tarde tropical', 'Oro negro', 'Pizarra chic',
    'Periódico dramático', 'Ocaso', 'Pincel de carbón', 'Neón tóxico', 'Rosa fantástica',
    'Nieve clara', 'Otoño increíble', 'Fiesta metálica', 'Infancia cerúlea', 'Bosque tenue',
    'Beige acogedor', 'Sirope rosado', 'Casa nórdica', 'Disparo cinético', 'Atardecer dorado',
    'Gris parisino', 'Película brumosa', 'Costa fresca', 'Verde místico', 'Violeta suave',
    'Crepúsculo lo-fi', 'Mate desvanecido', 'Noche púrpura', 'Horror vintage', 'Orilla de limón',
    'Atardecer rosado', 'Nostalgia secreta', 'Flash sombrío', 'Lluvia otoñal', 'Sol real',
    'Piel cálida', 'Dulce caramelo', 'Grano de vino', 'Violeta brumoso', 'Destello dorado',
    'Días descoloridos',
  ],
  'Halloween': [
    'Fantasía', 'Negro azulado', 'Criatura', 'Verde neón', 'Bruja naranja', 'Noche maligna',
    'Ensueño', 'Dulce', 'Noche espiritual', 'Séptimo cielo', 'Calabaza', 'Tarde noche',
    'Brillos rojos', 'Noche fría', 'Cámara roja', 'Dulce tenue', 'Noche oscura', 'Telaraña',
    'Murciélago', 'Noche eterna', 'Terror sereno', 'Horror místico', 'Festín brumoso',
    'Verde místico', 'Fallo de neón', 'Hongo mágico', 'Brillo azul', 'Tenebroso genial',
    'Disco', 'Brillo dorado', 'Anime negro', 'Fiesta salvaje', 'Verde anulado',
    'Espíritu profundo', 'Película brumosa', 'Noche escarlata', 'Noche malvada', 'Cuarzo verde',
    'Grito púrpura', 'Noche mágica', 'Calabaza II', 'Sigilo oscuro', 'Horror vintage',
    'VHS velado', 'Cámara brillante', 'Lienzo rojizo',
  ],
  'NUEVO': [
    'Deslumbrante', 'Mariposa florida', 'Verbena', 'Coche rosa', 'Gris urbano', 'Imagina',
    'Noche fucsia', 'Bosque luminoso', 'Calle antigua', 'Hongo mágico', 'Escapada grupal',
    'Azul miel', 'Plaza pop', 'Búho naranja', 'Grano dorado', 'Falla mágica', 'Flash gris',
    'Festín moreno', 'Amor a la deriva', 'Chic estudiantil', 'Azul sereno', 'Teatro oscuro',
    'Ciudad futura', 'Naranja fuego', 'Periódico dramático', 'Ciudad luna', 'Oeste pastel',
    'Azul melancólico', 'Cielo vívido', 'Destello melocotón', 'Ambiente suave', 'Chica Ferrari',
    'Azul 2000', 'Luz cálida', 'Película bronce', 'Campos en flor', 'Noche neón',
    'Cielo invierno', 'Bahía fría', 'Ciudad caótica', 'Estadio local', 'Dunas doradas',
    'Sueño fresa', 'Niebla violeta', 'Brillo ámbar', 'Luz diaria',
  ],
  'Bombazos': [
    'Universo florido', 'Saturación audaz', 'Escena veraniega', 'Cielo claro', 'Cálido vívido',
    'Lima fresca', 'Verso vívido', 'Atardecer universal', 'Negro frío', 'Película bronce',
    'Mar sin nubes', 'Noches de Río', 'Crema', 'Carmesí oscuro', 'Retro', 'Película retro',
    'Y2K Vogue', 'Cian profundo', 'Brillo 90', 'Luces nocturnas', 'Distorsión rosa',
    'Pelusilla 2', 'Flash noir', 'Niebla compacta', 'Seda', 'Mancha lateral', 'Rayo lavanda',
    'Thriller frío', 'Luz tenue', 'Chica de los 2000', 'Gris bronce', 'Pura alegría',
    'Bosque lavado', 'Blanco tierra', 'Blues', 'Impresión retro', 'Calle apagada',
    'Flash digital', 'Vibra', 'Brillo elevado', 'Beso', 'Realce de luz', 'Matices crípticos',
    'Físico I', 'Físico II',
  ],
  'Vida': [
    'Saturación audaz', 'Vintage interior', 'Nostalgia secreta', 'Brillo intenso',
    'Otoño cálido', 'Verde mejorar', 'Brillo', 'Simple', 'Sueño caqui', 'Otoño increíble',
    'Corrección de fondo', 'Azul bebé', 'Viaje', 'Crema', 'Tono oscuro II', 'Niebla helada',
    'Café oscuro', 'Bokeh', 'Verano dulce', 'Otoño dorado', 'Naranja fresca', 'Humilde',
    'Sombra', 'Bronce pacífico', 'Visión viva II', 'Brillo brumoso', 'Halo blanco',
    'Granulado ámbar', 'Grano mate', 'Noche oscura', 'Pastel brillante', 'Cine sombrío',
    'Beso de rosa', 'Chic y místico', 'Película ámbar', 'Pizarra chic', 'Costa francesa',
  ],
  'Paisaje': [
    'Claro II', 'Hotel céntrico', '8K', 'Crema clara', 'Pueblo frío', 'Verso vívido',
    'Lima fresca', 'Océano salado', 'Caramelo intenso', 'Primavera tardía', 'Recorrido jardín',
    'Bosque celeste', 'Azul pastel', 'Montaña otoñal', 'Ojo oceánico', 'Verano',
    'Navidad dorada', 'Atardecer sueño', 'Soleado', 'Pop festivo', 'Miel cristalina',
    'Alegría vívida', 'Resumen diario', 'Calle antigua', 'Café acogedor', 'Plata oscuro',
    'Noche nevada', 'Calma rústica', 'Película Atami', 'Verde soleado', 'Isla solitaria',
    'Abedul suave', 'Neblina etérea', 'Alegría soleada', 'Ciudad fría', 'Pradera verde',
    'Ámbar dorado', 'Metro frío',
  ],
  'Retrato': [
    'Frescura', 'Escena veraniega', 'Rejuvenecer piel', 'Brillo dorado', 'Retrato retro',
    'Radiante', 'Pelusilla 2', 'Brillo soleado', 'Vibra nude', 'Rosa bajo el sol',
    'Tonos oscuros', 'Chica playa', 'Ámbar cálido', 'Seda', 'Cómodo retro', 'Sombra azul',
    'Trigo mate', 'Luz ámbar', 'Atardecer acogedor', 'Polvo cayendo', 'Casa nórdica',
    'Listón dorado', 'Lluvia otoñal', 'Noche relajada', 'Brillo', 'Dulce caramelo',
    'Brillo meloso', 'Claridad del sol', 'Sol de verano', 'Tarde noche', 'Noir callejero',
    'Piel de cristal', 'Claridad nude', 'Calle urbana', 'Suave', 'Noche mágica',
    'Frescor aireado', 'Marrón dorado', 'Rosa pálido', 'Bruma suave', 'Cálido vívido',
    'Suave soleado', 'Nieve clara', 'Luz fría', 'Esmalte Hailey', 'Azul nude',
  ],
  'Blanco y negro': [
    'B&W', 'Impresionante', 'Píxel estilo noir', 'Vacaciones Roma', 'Brujo', 'B&W 3',
    'Blanco elegante', 'Negro azulado', 'Café', 'Película bronce', 'Flash noir',
    'Rollo vintage', 'Película clásica', 'Ruido de TV', 'Toque mate', 'Película mate',
    'Visión retro', 'Calidez marrón', 'Monocromo profundo', 'Noir lluvioso',
    'Desvanecido en papel', 'Impresión negra', 'Brillo negro', 'Negro frío', 'Lienzo retro',
    'Impresión retro', 'Periódico dramático', 'Negro vintage', 'Casablanca', 'Bruma insomne',
    'Desvanecer', 'Neblina pálida', 'Anime negro', 'Negro mate', 'Noir vintage',
    'Verano negro',
  ],
  'Películas': [
    'Gris azulado', 'Romance de montaña', 'Misión de amor', 'Película pulp', 'Mancha lateral',
    'Prado soleado', 'Cóctel de cerezas', 'Gris urbano', 'Vacaciones salvajes', 'Libertad',
    'Rubí de noche', 'Anora', 'Cian profundo', 'Destello ocular', 'Luz fría', 'Paseo nocturno',
    'Destello costero', 'Madera tenue', 'Recuerdo brisa', 'Caza de lente', 'Costa soleada',
    'Luz', 'Amor a la deriva', 'Ciudad helada', 'Película fría', 'Bosque tenue',
    'Secretos oscuros', 'Días dorados', 'Cian suave', 'Azul cálido', 'Calle relajada',
    'Filtro miel', 'Sueño dunas', 'Bokeh verde', 'Luz tenue',
  ],
  'Retro': [
    'Película', 'Retro americano', 'Isla silenciada', 'Ciruela intensa', 'Princeton',
    'Nostalgia', 'París', 'Y2K Vogue', 'Niñez', 'Azul soleado', 'GTA I', 'Vieja llama',
    'GTA III', 'Cian natural', 'Terciopelo tropical', 'HUJI', 'Película clásica', 'Brisa',
    'Recuerdo precioso', 'Calle oxidada', 'Calidez gráfica', 'Estilo los 90', 'Color rojizo',
    'Luna de miel', 'Rosa psicodélico', 'Destello ámbar', 'Pop funky', 'Vacaciones primavera',
    'Sirope rosado', 'Chica de los 90', 'Grano dorado', 'Estilo', 'Brillo piscina',
    'Glamur atrevido', 'Vacaciones verano', 'Verde vintage', 'Sepia salvaje',
    'Claridad vívida', 'Nubes', 'Duna soleada', 'Brillo', 'Película verde',
    'Escuela de los 90',
  ],
  'Herramientas': [
    '8K', 'Color óptimo', 'Retoque de fondo', 'Reparar desenfoque', 'Bokeh',
    'Eliminar niebla', 'Restaurar calidad', 'Mejorar', 'Claridad optimizada',
    'Complejo seda', 'Cámara HD2', 'Luz HD', 'Mejora HD', 'Mascota HD',
  ],
  'Alternativo': [
    'Nostalgia neón', 'Doble prisma', 'Patio de juegos', 'Horror místico', 'Cuadro cinético',
    'Pandora', 'Borgoña', 'Visión nocturna', 'Estudio gráfico', 'Noche zozobrante',
    'Oro negro', 'Disparo cinético', 'Neón tóxico', 'Azul cremoso', 'Verde místico',
    'Pincel de carbón', 'Bosque lavado', 'Dorado suave', 'Púrpura neón', 'Noche rojiza',
    'Escritorio retro', 'Ruido cinético', 'Espeluznante lindo', 'Niebla mística',
    'Neón lebroso', 'Gris acero', 'Álbum', 'Película brumosa', 'Estrella nocturna',
    'Violeta neón', 'Noche mágica', 'Frío ardiente', 'Psicodélico frío', 'Destello cotón',
    'Horror vintage', 'Espíritu profundo', 'Error retro', 'Verde', 'Cuarto verde',
    'Hongo mágico', 'Violeta suave', 'Festín brumoso', 'Cámara roja', 'Noche fuego',
    'Disco', 'Moiré negro', 'Brillos rosas', 'Fiesta salvaje', 'Falla',
  ],
  'Noche': [
    'Rubor de neón', 'Brillo de llama', 'Neblina violeta', 'Bar clandestino', 'Azul frío',
    'Oro negro', 'Banco dorado', 'Ciudad nocturna', 'Destello neón', 'Chispa fría',
    'Noche tranquila', 'Azul anaranjado', 'Hielo negro', 'Cyberpunk', 'Frío cósmico',
    'Neón nocturno', 'Hora azul', '2077', 'Brillante', 'Noche púrpura', 'Cian rojo',
    'Noche neón', 'Calor de Tokio', 'Noche santa', 'Noche urbana', 'Hipnosis', 'Noche serena',
    'Realce de luz', 'Azul desvanecido', 'Azul', 'Gris verdoso', 'Neón lluvioso', 'París',
    'Buenos sueños', 'Gala clandestina', 'Noche dulce', 'Calle tranquila', 'Suavidad nocturna',
  ],
  'Filtro frío': [
    'Luces nocturnas', 'Brillo frío', 'Claro diamante', 'Niebla azul', 'Fresa helada', 'Gris',
    'Gris elegante', 'Cielo sin sol', 'Piel clara', 'Sobrio marcado', 'Menta fría',
    'Azul invernal', 'Urbanoide', 'Beige', 'Frío brumoso', 'Movimiento fresco',
    'Melodía suave', 'Reinicio físico', 'Índigo sereno', 'Retrato fresco', 'Tranquilo',
    'Inmaculado', 'Humilde oscura', 'Ciudad caótica', 'Vibra', 'Cariño azul',
    'Limpio y ligero', 'Marea neón', 'Vibra relajada',
  ],
  'Filtro cálido': [
    'Oro apagado', 'Tarde tropical', 'Crepúsculo cálido', 'Brillo de nubes', 'Bronceado miel',
    'Calle soleada', 'Durazno cálido', 'Moka al sol', 'Fiesta neón', 'Bronce rústico',
    'Cálido gélido', 'Sombra aceituna', 'Calidez errante', 'Noche rojiza', 'Sombra cálida',
    'Destello moka', 'Bomba cereza', 'Crepúsculo lo-fi', 'Rubio soleado', 'Beige retro',
    'Romance lavado', 'Calidez ámbar', 'Picnic soleado', 'Baño de sol', 'Cálido',
    'Trigo mate 2', 'Oliva soleada', 'Desvanecido cálido', 'Marrón leñoso', 'Luz solar HD',
    'Canela', 'Radiante', 'Calor suave', 'Bronce dorado', 'Luz solar cristalina',
    'Romance trigo', 'Navidad en casa', 'Fantasía rosa', 'Fuego de neón', 'Hora dorada',
    'Vieja chimenea', 'Calor', 'Bronce soleado',
  ],
  'Comida': [
    'Exquisito', 'Carbón ardido', 'Crepúsculo beige', 'Vívido tenue', 'Rosa helado',
    'Brillo de vela', 'Blanco tiza', 'Capricho italiano', 'Blanco vívido', 'Limón fresco',
    'Estallido frutal', 'Lienzo al óleo', 'Comida importante', 'Occidental', 'Alimonado',
    'Blanco acogedor', 'Francés', 'Serrano', 'Burbuja de aire', 'Capuchino', 'Rayo',
    'Mantequilla y queso', 'Apetito', 'Blanco lechoso', 'Eclipse', 'Frío vívido', 'Hornear',
    'Bagels', 'Bocadillo', 'Miso', 'Gourmet I', 'Gourmet II', 'Té blanco', 'Cocina',
    'Diente dulce', 'Baba de azúcar', 'Refresco frío', 'Hora feliz', 'Mantequilla ligera',
    'Bastón caramelo', 'Menta fresca', 'Durazno',
  ],
  'Cabina fotográfica': [
    'Simulación', 'Suave carmesí', 'Atracción de todos', 'Piel cálida', 'Gris bronce',
    'Piel intensa', 'Sepia retro', 'Tono cálido', 'Glamur ácido', 'Vieja llama',
    'Baile antiguo', 'Icono temporal', 'Elegancia clásica', 'Marco sepia', 'Cariño retro',
    'Piel suave rosa', 'Bokeh', 'Rosa', 'Grano sepia', 'Noche salvaje', 'Estudio retro',
    'Exposición antigua', 'Blanco tierra', 'Flash gris', 'Piel suave', 'Vieja luz de miel',
    'Exposición plateada', 'Viejo amigo', 'Fama pasada', 'Lavado de vino', 'Clásico de LA',
    'Recuerdo cálido', 'Nostalgia íntima',
  ],
  'CCD': [
    'CCD con flash', 'Acogedor estilo', 'Retro Kong', 'Película tenue', 'Rubor CCD',
    'Marfil suave', 'Destello bosque', 'Enfoque místico', 'Brillo lechoso',
    'Película oleada', 'Calle envejecida', 'Brillo claro', 'Lo-Fi frío', 'Grano tenue',
    'Seda', 'Flash CCD', 'Rosa suave', 'CCD rosa', 'Vibra latte', 'Cámara suave',
    'CCD genial', 'Desvanecido película', 'Mate desvanecido', 'Resplandor lente',
    'Brillo Hassy', 'Contraste vivido', 'Ricoh nación', 'Flash', 'Película oliva',
    'Fuji Velvia', 'Gris agua', 'Brillo',
  ],
  'Mascotas': [
    'Paseo de perros', 'Dorado suave', 'Desenfoque helado', 'Mascota HD', 'Pastel claro',
    'Patas dulces', 'Peludo crema', 'Estudio mascotas', 'Resplandor acuario',
    'Jardín conejoso', 'Bosque umbrío', 'Parque noche', 'Bolita caramelo', 'Rayo de peludo',
    'Tarde', 'Jengibre suave', 'Foto de abrazo', 'Perrito caramelo', 'Claridad peluda',
    'Gato ratón', 'Sueño peludito', 'Verde gato', 'Feliz siempre', 'Captura cálida',
    'Abrazo cariñoso', 'Zoom mocico', 'Faro de ronroneo', 'Calentito acogedor',
    'Brillo peludo',
  ],
};

const slug = (text) => text
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');

function cssFrom([s, c, b, h, sep, g, blur], i) {
  const parts = [];
  // Pequeña variación determinista para que ningún filtro sea idéntico a otro.
  const sat = Math.max(0.4, s + ((i % 3) - 1) * 0.04);
  const hue = h + ((i * 7) % 15) - 7;
  const bright = Math.max(0.7, b + ((i % 5) - 2) * 0.008);
  if (g > 0) parts.push(`grayscale(${g})`);
  if (sep > 0) parts.push(`sepia(${sep})`);
  parts.push(`saturate(${sat.toFixed(2)})`);
  parts.push(`hue-rotate(${hue}deg)`);
  parts.push(`contrast(${c})`);
  parts.push(`brightness(${bright.toFixed(3)})`);
  if (blur > 0) parts.push(`blur(${blur}px)`);
  return parts.join(' ');
}

let counter = 0;
export const CAPCUT_FILTERS = Object.entries(SEEDS).reduce((catalog, [category, labels]) => {
  const profiles = PROFILES[category];
  labels.forEach((label, index) => {
    counter += 1;
    catalog[`cf${counter}_${slug(label)}`] = {
      label,
      category,
      css: cssFrom(profiles[index % profiles.length], index),
    };
  });
  return catalog;
}, {});
