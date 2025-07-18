export function secToMin(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);

  return `${h > 0 ? `${h}h ` : ''}${m}min`;
}