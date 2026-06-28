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
  'Sushi':     { solid: '#3F4DB5', grad: ['#5562D6', '#2B2E78'], chipBg: '#EEF0FB', chipText: '#3F4DB5' },
  'Vegano':    { solid: '#3F8C2E', grad: ['#54A53F', '#1F4D17'], chipBg: '#EFF8EC', chipText: '#3F8C2E' },
  'Bebidas':   { solid: '#0E7AAE', grad: ['#1894CB', '#0C4A6E'], chipBg: '#E8F4FB', chipText: '#0E7AAE' },
  default:     { solid: '#E63A2E', grad: ['#E63A2E', '#8C1D17'], chipBg: '#FDEEEC', chipText: '#C42B22' },
};

export function getCategoryTheme(category) {
  return CATEGORY_THEME[category] ?? CATEGORY_THEME.default;
}

export default CATEGORY_THEME;
