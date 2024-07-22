const state = new Map<string, boolean>();

window.addEventListener('keydown', (e) => {
  state.set(e.key, true);
});
window.addEventListener('keyup', (e) => {
  state.set(e.key, false);
});

export function isKeyPressed(key: string) {
  return state.get(key) === true;
}