import type { CSSProperties, HTMLAttributes } from 'react';
import { getSpriteCell, type SpriteCategory } from './atlas';

type SpriteProps = Omit<HTMLAttributes<HTMLSpanElement>, 'children'> & {
  category: SpriteCategory;
  spriteNumber: number;
  size?: number;
};

export function Sprite({
  category,
  spriteNumber,
  size = 64,
  className = '',
  style,
  ...props
}: SpriteProps) {
  const cell = getSpriteCell(category, spriteNumber);
  const scale = size / cell.sheet.cellSize;

  const spriteStyle: CSSProperties = {
    width: size,
    height: size,
    backgroundImage: `url(${cell.sheet.url})`,
    backgroundSize: `${cell.sheet.columns * cell.sheet.cellSize * scale}px ${cell.sheet.rows * cell.sheet.cellSize * scale}px`,
    backgroundPosition: `${-cell.column * size}px ${-cell.row * size}px`,
    ...style,
  };

  return (
    <span
      role="img"
      aria-label={`${category} sprite ${cell.spriteNumber}`}
      className={`sprite ${className}`}
      style={spriteStyle}
      {...props}
    />
  );
}
