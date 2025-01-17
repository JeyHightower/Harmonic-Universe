export const SHORTCUTS = {
  SAVE: { key: 's', modifier: 'ctrl' },
  NEW: { key: 'n', modifier: 'ctrl' },
  UNDO: { key: 'z', modifier: 'ctrl' },
  REDO: { key: 'y', modifier: 'ctrl' },
  DELETE: { key: 'Delete', modifier: null },
  SEARCH: { key: 'f', modifier: 'ctrl' },
  EXPORT: { key: 'e', modifier: 'ctrl' },
  IMPORT: { key: 'i', modifier: 'ctrl' },
  TOGGLE_VIEW: { key: 'v', modifier: 'ctrl' },
};

export const isModifierPressed = (event, modifier) => {
  if (!modifier) return true;

  // Handle both Windows/Linux (ctrlKey) and Mac (metaKey)
  const isMac = /Mac|iPod|iPhone|iPad/.test(navigator.platform);
  if (isMac) {
    return modifier === 'ctrl' ? event.metaKey : event[`${modifier}Key`];
  }
  return event[`${modifier}Key`];
};

export const matchesShortcut = (event, shortcut) => {
  const { key, modifier } = SHORTCUTS[shortcut];
  return (
    event.key.toLowerCase() === key.toLowerCase() &&
    isModifierPressed(event, modifier)
  );
};

export const createShortcutHandler = handlers => event => {
  // Don't trigger shortcuts when typing in input fields
  if (
    event.target.tagName === 'INPUT' ||
    event.target.tagName === 'TEXTAREA' ||
    event.target.isContentEditable
  ) {
    return;
  }

  Object.entries(handlers).forEach(([shortcut, handler]) => {
    if (matchesShortcut(event, shortcut)) {
      event.preventDefault();
      handler(event);
    }
  });
};

export const getShortcutLabel = shortcut => {
  const { key, modifier } = SHORTCUTS[shortcut];
  const isMac = /Mac|iPod|iPhone|iPad/.test(navigator.platform);

  const modifierSymbol = modifier
    ? isMac
      ? {
          ctrl: '⌘',
          alt: '⌥',
          shift: '⇧',
        }[modifier]
      : {
          ctrl: 'Ctrl',
          alt: 'Alt',
          shift: 'Shift',
        }[modifier]
    : '';

  const keySymbol = key.length === 1 ? key.toUpperCase() : key;

  return modifier ? `${modifierSymbol}+${keySymbol}` : keySymbol;
};
