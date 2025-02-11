import SendIcon from '@mui/icons-material/Send';
import {
    Avatar,
    Box,
    Button,
    Divider,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    Paper,
    TextField,
    Typography,
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useSocket } from '../../hooks/useSocket';

interface CollaborationPanelProps {
    sceneId: string | undefined;
}

interface Message {
    id: string;
    userId: string;
    username: string;
    content: string;
    timestamp: string;
}

interface User {
    id: string;
    username: string;
    cursorPosition?: { x: number; y: number };
}

const CollaborationPanel: React.FC<CollaborationPanelProps> = ({ sceneId }) => {
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [activeUsers, setActiveUsers] = useState<User[]>([]);
    const { socket } = useSocket();
    const { user } = useAuth();

    useEffect(() => {
        if (!socket || !sceneId) return;

        // Join scene room
        socket.emit('join', { sceneId, userId: user?.id });

        // Listen for messages
        socket.on('chat_message_received', (newMessage: Message) => {
            setMessages((prev) => [...prev, newMessage]);
        });

        // Listen for presence updates
        socket.on('presence_update', ({ users }: { users: User[] }) => {
            setActiveUsers(users);
        });

        // Listen for cursor updates
        socket.on('cursor_moved', ({ userId, position }) => {
            setActiveUsers((prev) =>
                prev.map((u) =>
                    u.id === userId ? { ...u, cursorPosition: position } : u
                )
            );
        });

        return () => {
            socket.emit('leave', { sceneId });
            socket.off('chat_message_received');
            socket.off('presence_update');
            socket.off('cursor_moved');
        };
    }, [socket, sceneId, user]);

    const handleSendMessage = () => {
        if (!message.trim() || !socket || !sceneId) return;

        socket.emit('chat_message', {
            sceneId,
            userId: user?.id,
            message: message.trim(),
        });

        setMessage('');
    };

    return (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 2 }}>
            <Typography variant="h6" gutterBottom>
                Collaboration
            </Typography>

            <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                    Active Users
                </Typography>
                <List>
                    {activeUsers.map((activeUser) => (
                        <ListItem key={activeUser.id}>
                            <ListItemAvatar>
                                <Avatar>{activeUser.username[0]}</Avatar>
                            </ListItemAvatar>
                            <ListItemText primary={activeUser.username} />
                        </ListItem>
                    ))}
                </List>
            </Paper>

            <Divider />

            <Box sx={{ flex: 1, overflow: 'auto', my: 2 }}>
                <List>
                    {messages.map((msg) => (
                        <ListItem key={msg.id}>
                            <ListItemAvatar>
                                <Avatar>{msg.username[0]}</Avatar>
                            </ListItemAvatar>
                            <ListItemText
                                primary={msg.username}
                                secondary={msg.content}
                                secondaryTypographyProps={{
                                    sx: { whiteSpace: 'pre-wrap' },
                                }}
                            />
                        </ListItem>
                    ))}
                </List>
            </Box>

            <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                    fullWidth
                    size="small"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                        }
                    }}
                    placeholder="Type a message..."
                    multiline
                    maxRows={4}
                />
                <Button
                    variant="contained"
                    onClick={handleSendMessage}
                    disabled={!message.trim()}
                >
                    <SendIcon />
                </Button>
            </Box>
        </Box>
    );
};

export default CollaborationPanel;
