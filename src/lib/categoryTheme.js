/**
 * Fuente única de verdad para los colores por categoría.
 * Reemplaza los mapas inline (CAT_GRADIENT / CAT_LOGO_BG / CAT_CHIP)
 * que estaban dispersos dentro de los componentes.
 *
 * Paleta armonizada con la marca: tonos cálidos y terrosos que
 * conviven con el rojo vermellón y el fondo crema del Design System.
 */
const CATEGORY_THEME = {
  'Rotisería': { solid: '#E8590C', grad: ['#F2772E', '#C2410C'], chipBg: '#FFF3E8', chipText: '#C2410C' },
  'Parrilla':  { solid: '#C42B22', grad: ['#E63A2E', '#8C1D17'], chipBg: '#FDEEEC', chipText: '#C42B22' },
  'Pizza':     { solid: '#D98C0A', grad: ['#F2A516', '#B45309'], chipBg: '#FEF6E6', chipText: '#B45309' },
  'Empanadas': { solid: '#15803D', grad: ['#22A559', '#14532D'], chipBg: '#EDF8F0', chipText: '#15803D' },
  'Sushi':     { solid: '#0F766E', grad: ['#129488', '#0B4A45'], chipBg: '#E7F4F2', chipText: '#0F766E' },
  'Vegano':    { solid: '#3F8C2E', grad: ['#54A53F', '#1F4D17'], chipBg: '#EFF8EC', chipText: '#3F8C2E' },
  'Bebidas':   { solid: '#B45309', grad: ['#D97A1A', '#7C3A06'], chipBg: '#FEF3E2', chipText: '#B45309' },
  default:     { solid: '#E63A2E', grad: ['#E63A2E', '#8C1D17'], chipBg: '#FDEEEC', chipText: '#C42B22' },
};

export function getCategoryTheme(category) {
  return CATEGORY_THEME[category] ?? CATEGORY_THEME.default;
}

export default CATEGORY_THEME;
