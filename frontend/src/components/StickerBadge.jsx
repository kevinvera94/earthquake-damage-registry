// Etiqueta del color de sticker. Se usa siempre para mostrar un sticker (CODING-STANDARDS §2.3).
import { NO_STICKER, STICKERS } from '../lib/catalogs';

// Las clases de global.css (portadas del mockup) usan los nombres en español
const CSS_MODIFIER = { red: 'rojo', yellow: 'amarillo', green: 'verde' };

/** `sticker`: 'green' | 'yellow' | 'red', o null si la edificación no se ha inspeccionado. */
export default function StickerBadge({ sticker }) {
  const item = STICKERS.find((s) => s.value === sticker);
  if (!item) return <span className="etq etq--neutro">{NO_STICKER.label}</span>;
  return (
    <span className={`etq etq--${CSS_MODIFIER[item.value]}`} title={item.title}>
      {item.label}
    </span>
  );
}
