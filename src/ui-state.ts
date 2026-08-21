export const SECTION_COUNT = 6;

export interface UiState {
  readonly activeSection: number;
  readonly history: readonly number[];
  readonly actionCounts: readonly number[];
}

export function createUiState(): UiState {
  return {
    activeSection: 0,
    history: [],
    actionCounts: Array.from({ length: SECTION_COUNT }, () => 0),
  };
}

export function selectSection(state: UiState, section: number): UiState {
  if (
    section < 0 ||
    section >= SECTION_COUNT ||
    section === state.activeSection
  )
    return state;

  return {
    ...state,
    activeSection: section,
    history: [...state.history, state.activeSection],
  };
}

export function goBack(state: UiState): UiState {
  const previous = state.history.at(-1);
  if (previous === undefined) return state;

  return {
    ...state,
    activeSection: previous,
    history: state.history.slice(0, -1),
  };
}

export function performAction(state: UiState): UiState {
  const actionCounts = [...state.actionCounts];
  actionCounts[state.activeSection] =
    (actionCounts[state.activeSection] ?? 0) + 1;
  return { ...state, actionCounts };
}
