import { describe, expect, it } from "vitest";
import {
  createUiState,
  goBack,
  performAction,
  selectSection,
} from "../src/ui-state";

describe("UI state", () => {
  it("moves between sections and returns through history", () => {
    const first = selectSection(createUiState(), 3);
    const second = selectSection(first, 5);

    expect(goBack(second).activeSection).toBe(3);
    expect(goBack(goBack(second)).activeSection).toBe(0);
  });

  it("keeps action counts isolated by section", () => {
    const first = performAction(createUiState());
    const second = performAction(selectSection(first, 2));

    expect(second.actionCounts).toEqual([1, 0, 1, 0, 0, 0]);
  });
});
