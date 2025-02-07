import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    TextField,
    Typography,
} from '@mui/material';
import { useState } from 'react';

interface AIPromptDialogProps {
    open: boolean;
    onClose: () => void;
    onGenerate: (prompt: string) => void;
    type: 'story' | 'harmony' | 'physics';
}

const PROMPT_SUGGESTIONS = {
    story: [
        'Create a dramatic turning point in the universe',
        'Introduce a mysterious phenomenon',
        'Describe a harmonious convergence',
    ],
    harmony: [
        'Generate a peaceful, floating melody',
        'Create an intense, dramatic progression',
        'Compose a mysterious, ethereal soundscape',
    ],
    physics: [
        'Design a stable orbital system',
        'Create chaotic but balanced forces',
        'Generate a harmonious wave pattern',
    ],
};

const TYPE_DESCRIPTIONS = {
    story: 'Generate a new story point that will be added to the universe timeline. The AI will consider the current state of physics and harmony parameters.',
    harmony: 'Create new harmony parameters based on your description. The AI will generate appropriate frequency, scale, and tempo values.',
    physics: 'Generate physics parameters that match your description. The AI will adjust gravity, friction, and other forces accordingly.',
};

export const AIPromptDialog = ({
    open,
    onClose,
    onGenerate,
    type,
}: AIPromptDialogProps) => {
    const [prompt, setPrompt] = useState('');

    const handleGenerate = () => {
        if (prompt.trim()) {
            onGenerate(prompt.trim());
            setPrompt('');
        }
    };

    const handleClose = () => {
        setPrompt('');
        onClose();
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogTitle>
                Generate {type.charAt(0).toUpperCase() + type.slice(1)} with AI
            </DialogTitle>
            <DialogContent>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {TYPE_DESCRIPTIONS[type]}
                </Typography>
                <TextField
                    autoFocus
                    multiline
                    rows={4}
                    label="Prompt"
                    fullWidth
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe what you want to generate..."
                    variant="outlined"
                    sx={{ mb: 2 }}
                />
                <Typography variant="subtitle2" gutterBottom>
                    Suggestions:
                </Typography>
                {PROMPT_SUGGESTIONS[type].map((suggestion, index) => (
                    <Typography
                        key={index}
                        variant="body2"
                        color="text.secondary"
                        sx={{
                            cursor: 'pointer',
                            '&:hover': {
                                color: 'primary.main',
                            },
                            mb: 0.5,
                        }}
                        onClick={() => setPrompt(suggestion)}
                    >
                        • {suggestion}
                    </Typography>
                ))}
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose}>Cancel</Button>
                <Button
                    onClick={handleGenerate}
                    variant="contained"
                    disabled={!prompt.trim()}
                >
                    Generate
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default AIPromptDialog;
