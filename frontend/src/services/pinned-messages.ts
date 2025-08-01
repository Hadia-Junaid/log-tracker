import axios from '../api/axios';

export const getPinnedMessages = async (): Promise<string[]> => {
    try {
        const response = await axios.get('/mcp/pinned-messages');
        return response.data;
    } catch (error) {
        console.error('Failed to fetch pinned messages:', error);
        return [];
    }
};

export const updatePinnedMessages = async (messages: string[]): Promise<void> => {
    try {
        await axios.patch('/mcp/pinned-messages', { messages });
    } catch (error) {
        console.error('Failed to update pinned messages:', error);
        throw error;
    }
};
