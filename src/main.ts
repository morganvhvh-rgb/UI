import "./style.css";
import {
  createUiState,
  goBack,
  performAction,
  selectSection,
} from "./ui-state";

const sectionButtons = Array.from(
  document.querySelectorAll<HTMLButtonElement>("[data-section]"),
);
const backButton = requireElement<HTMLButtonElement>("[data-back]");
const actionButton = requireElement<HTMLButtonElement>("[data-action]");
const stageContent = requireElement<HTMLElement>(".stage-content");
const sectionLabel = requireElement<HTMLElement>(".section-label");
const stateLabel = requireElement<HTMLElement>(".state-label");
const sprite = requireElement<HTMLElement>(".sprite");

let state = createUiState();

function requireElement<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`Missing required element: ${selector}`);
  return element;
}

function twoDigits(value: number): string {
  return String(value).padStart(2, "0");
}

function render(previousSection = state.activeSection): void {
  sectionButtons.forEach((button, index) => {
    const isActive = index === state.activeSection;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-current", isActive ? "page" : "false");
  });

  sectionLabel.textContent = `SECTION ${twoDigits(state.activeSection + 1)}`;
  stateLabel.textContent = `STATE ${twoDigits(state.actionCounts[state.activeSection] ?? 0)}`;
  backButton.disabled = state.history.length === 0;

  const spriteIndex = state.actionCounts[0] ?? 0;
  sprite.style.setProperty("--sprite-column", String(spriteIndex % 20));
  sprite.style.setProperty(
    "--sprite-row",
    String(Math.floor(spriteIndex / 20) % 3),
  );

  if (previousSection !== state.activeSection) {
    stageContent.classList.remove("is-entering");
    void stageContent.offsetWidth;
    stageContent.classList.add("is-entering");
  }
}

sectionButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const section = Number(button.dataset.section);
    const previousSection = state.activeSection;
    state = selectSection(state, section);
    render(previousSection);
  });
});

backButton.addEventListener("click", () => {
  const previousSection = state.activeSection;
  state = goBack(state);
  render(previousSection);
});

actionButton.addEventListener("click", () => {
  state = performAction(state);
  render();
});

render();
