# Character Components (Consolidated)

This directory contains all character-related components that have been consolidated from the following directories:

- `src/components/character/`
- `src/components/characters/`

## Components

- `CharacterCard.jsx` - Displays a card view of a character
- `CharacterDetail.jsx` - Displays detailed information about a character
- `CharacterForm.jsx` - Form for creating or editing a character
- `CharacterList.jsx` - Displays a list of characters
- `CharacterSelector.jsx` - Component for selecting a character

## Consolidation Strategy

These components were consolidated to ensure a single source of truth for character-related components and to eliminate duplicate or similar implementations. This helps maintain consistency and simplifies the codebase.

## Usage

Import these components using:

```javascript
import {
  CharacterCard,
  CharacterDetail,
  CharacterForm,
  CharacterList,
  CharacterSelector,
} from "../components/characters";
```

## Styling

Component-specific styles are located in `Characters.css` in this directory.
