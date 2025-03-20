import { AIProvider } from './base';

export class BlackboxProvider implements AIProvider {
    private apiKey: string;

    constructor(apiKey: string) {
        this.apiKey = apiKey;
    }

    async complete(prompt: string, context: string): Promise<string> {
        const response = await fetch('https://www.useblackbox.io/api/v1/complete', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`
            },
            body: JSON.stringify({
                prompt,
                context,
                maxTokens: 500
            })
        });

        const data = await response.json();
        return data.completion;
    }
}
