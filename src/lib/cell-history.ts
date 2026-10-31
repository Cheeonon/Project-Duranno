export function formatCellHistoryPeriod(from: string, to: string) {
  return `${from.replaceAll('-', '.')} – ${to.replaceAll('-', '.')}`;
}
