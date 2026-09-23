import { useRef, useState } from 'react';
import { EnvironmentPreview } from './EnvironmentPreview';
import { Sprite } from './sprites/Sprite';
import { SPRITE_ATLAS, SPRITE_CATEGORIES, type SpriteCategory } from './sprites/atlas';

const TOTAL_SPRITES = SPRITE_CATEGORIES.reduce(
  (total, category) => total + SPRITE_ATLAS[category].count,
  0,
);

function hasEnvironment(category: SpriteCategory): category is 'Food' | 'Animals' {
  return category === 'Food' || category === 'Animals';
}

export function App() {
  const [category, setCategory] = useState<SpriteCategory>('Food');
  const [selectedNumber, setSelectedNumber] = useState(1);
  const indexRef = useRef<HTMLDivElement>(null);
  const count = SPRITE_ATLAS[category].count;

  function selectCategory(nextCategory: SpriteCategory) {
    setCategory(nextCategory);
    setSelectedNumber(1);
    if (indexRef.current) indexRef.current.scrollTop = 0;
  }

  return (
    <main className="catalog">
      <header className="catalog-header">
        <div className="catalog-title">Sprite index <span>{TOTAL_SPRITES.toLocaleString()}</span></div>
        <label className="category-control">
          <span className="sr-only">Category</span>
          <select
            value={category}
            onChange={(event) => selectCategory(event.target.value as SpriteCategory)}
          >
            {SPRITE_CATEGORIES.map((name) => (
              <option key={name} value={name}>{name} · {SPRITE_ATLAS[name].count}</option>
            ))}
          </select>
        </label>
      </header>

      <section className="preview" aria-label={`${category} preview`}>
        {hasEnvironment(category) ? (
          <EnvironmentPreview key={category} category={category} />
        ) : (
          <div className="preview-sprite">
            <Sprite category={category} spriteNumber={selectedNumber} size={128} />
          </div>
        )}
        <div className="preview-caption">
          <Sprite category={category} spriteNumber={selectedNumber} size={48} />
          <div>
            <strong>{category} {selectedNumber}</strong>
            <span>{selectedNumber} / {count}</span>
          </div>
        </div>
      </section>

      <section className="index-section" aria-label={`${category} sprite index`}>
        <div className="index-heading"><span>{category}</span><span>{count} sprites</span></div>
        <div className="sprite-grid-scroll" ref={indexRef}>
          <div className="sprite-grid">
            {Array.from({ length: count }, (_, index) => {
              const number = index + 1;
              return (
                <button
                  type="button"
                  className={`sprite-entry${selectedNumber === number ? ' is-selected' : ''}`}
                  key={number}
                  onClick={() => setSelectedNumber(number)}
                  aria-label={`${category} sprite ${number}`}
                  aria-pressed={selectedNumber === number}
                >
                  <Sprite category={category} spriteNumber={number} size={40} aria-hidden="true" />
                  <span>{number}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}
