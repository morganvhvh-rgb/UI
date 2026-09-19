import activityUrl from '../../sprites/activity.png';
import animalsUrl from '../../sprites/animals.png';
import charactersUrl from '../../sprites/characters.png';
import foodUrl from '../../sprites/food.png';
import natureUrl from '../../sprites/nature.png';
import objectsUrl from '../../sprites/objects.png';
import smileysPeopleUrl from '../../sprites/smileys-people.png';
import symbolsUrl from '../../sprites/symbols.png';
import travelPlacesUrl from '../../sprites/travel-places.png';
import weaponsUrl from '../../sprites/weapons.png';

export const SPRITE_CATEGORIES = [
  'Activity',
  'Animals',
  'Characters',
  'Food',
  'Nature',
  'Objects',
  'Smileys & People',
  'Symbols',
  'Travel & Places',
  'Weapons',
] as const;

export type SpriteCategory = (typeof SPRITE_CATEGORIES)[number];

export type SpriteSheet = {
  url: string;
  columns: number;
  rows: number;
  count: number;
  cellSize: number;
};

export const SPRITE_ATLAS: Record<SpriteCategory, SpriteSheet> = {
  Activity: { url: activityUrl, columns: 20, rows: 7, count: 123, cellSize: 16 },
  Animals: { url: animalsUrl, columns: 20, rows: 6, count: 103, cellSize: 16 },
  Characters: { url: charactersUrl, columns: 20, rows: 3, count: 49, cellSize: 16 },
  Food: { url: foodUrl, columns: 20, rows: 11, count: 219, cellSize: 16 },
  Nature: { url: natureUrl, columns: 20, rows: 8, count: 145, cellSize: 16 },
  Objects: { url: objectsUrl, columns: 20, rows: 27, count: 538, cellSize: 16 },
  'Smileys & People': { url: smileysPeopleUrl, columns: 20, rows: 17, count: 327, cellSize: 16 },
  Symbols: { url: symbolsUrl, columns: 20, rows: 13, count: 257, cellSize: 16 },
  'Travel & Places': { url: travelPlacesUrl, columns: 20, rows: 9, count: 163, cellSize: 16 },
  Weapons: { url: weaponsUrl, columns: 20, rows: 5, count: 81, cellSize: 16 },
};

export function getSpriteCell(category: SpriteCategory, spriteNumber: number) {
  const sheet = SPRITE_ATLAS[category];
  const safeNumber = Math.min(Math.max(Math.trunc(spriteNumber), 1), sheet.count);
  const zeroBasedIndex = safeNumber - 1;

  return {
    sheet,
    spriteNumber: safeNumber,
    column: zeroBasedIndex % sheet.columns,
    row: Math.floor(zeroBasedIndex / sheet.columns),
  };
}
