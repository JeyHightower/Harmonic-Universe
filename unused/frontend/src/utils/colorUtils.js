export const calculateHarmonyColor = (harmonyValue) => {
  return `hsl(${harmonyValue * 120}, 70%, 50%)`;
};

export const getColorScale = (
  value,
  { hue = 120, saturation = 70, lightness = 50 } = {},
) => {
  return `hsl(${value * hue}, ${saturation}%, ${lightness}%)`;
};

export const interpolateColors = (color1, color2, factor) => {
  return `hsl(${color1 + (color2 - color1) * factor}, 70%, 50%)`;
};
