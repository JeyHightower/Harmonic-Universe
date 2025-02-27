export const aiCommands = {
    // ... existing commands ...

    'ai.blackbox.complete': {
        title: 'Get Blackbox Suggestion',
        handler: async (editor: Editor) => {
            const selection = editor.getSelection();
            const context = editor.getContext(); // Get surrounding code

            const blackbox = new BlackboxProvider(config.get('blackbox.apiKey'));
            const suggestion = await blackbox.complete(selection, context);

            // Show suggestion UI
            showSuggestion({
                content: suggestion,
                onAccept: () => {
                    editor.replaceSelection(suggestion);
                }
            });
        }
    }
};
