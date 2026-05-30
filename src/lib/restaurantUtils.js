function inSlot(open, close) {
  if (!open || !close) return false;
  const now = new Date();
  const [oh, om] = open.slice(0, 5).split(':').map(Number);
  const [ch, cm] = close.slice(0, 5).split(':').map(Number);
  const cur = now.getHours() * 60 + now.getMinutes();
  const openMin = oh * 60 + om;
  const closeMin = ch * 60 + cm;
  if (openMin <= closeMin) return cur >= openMin && cur < closeMin;
  return cur >= openMin || cur < closeMin;
}

function slotIsOpen(openTime, closeTime, override) {
  if (override === false) return false;
  if (!openTime || !closeTime) return false;
  return inSlot(openTime, closeTime);
}

export function isRestaurantOpen(restaurant) {
  const { opening_time, closing_time, is_open_override,
          opening_time_2, closing_time_2, is_open_override_2 } = restaurant;
  const hasSlot1 = opening_time && closing_time;
  const hasSlot2 = opening_time_2 && closing_time_2;
  if (!hasSlot1 && !hasSlot2) return true;
  return slotIsOpen(opening_time, closing_time, is_open_override)
      || slotIsOpen(opening_time_2, closing_time_2, is_open_override_2);
}
