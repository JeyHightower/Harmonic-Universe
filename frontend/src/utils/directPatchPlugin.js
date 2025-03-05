// A plugin that directly modifies the bundled Ant Icons code
export default function directPatchPlugin() {
    return {
        name: 'direct-patch-ant-icons',
        apply: 'build', // Only apply during build

        generateBundle(options, bundle) {
            // Find the ant-icons chunk
            const antIconsChunk = Object.keys(bundle).find(
                name => name.includes('ant-icons')
            );

            if (antIconsChunk) {
                console.log('[DirectPatch] Found Ant Icons chunk:', antIconsChunk);
                const chunk = bundle[antIconsChunk];

                // Direct replacement for React.createContext
                const patchedCode = `
// Direct patch for React.createContext
if (typeof React === 'undefined' || !React.createContext) {
  var React = React || {};
  React.createContext = function(defaultValue) {
    return {
      Provider: function(props) { return props.children; },
      Consumer: function(props) { return props.children(defaultValue); },
      _currentValue: defaultValue
    };
  };
}

// Ensure IconContext is defined even if React.createContext fails
var ensureIconContext = function() {
  try {
    return React.createContext({});
  } catch (e) {
    console.warn('[DirectPatch] Error creating IconContext:', e);
    return {
      Provider: function(props) { return props.children; },
      Consumer: function(props) { return props.children({}); }
    };
  }
};

// Create a local reference to IconContext
var IconContext = ensureIconContext();

${chunk.code}`;

                // Apply the patched code
                chunk.code = patchedCode;
                console.log('[DirectPatch] Applied direct patch to Ant Icons chunk');
            } else {
                console.warn('[DirectPatch] No Ant Icons chunk found!');
            }
        }
    };
}
