import { h } from "preact";
import { useEffect, useState } from "preact/hooks";
import { ChatbotAPI } from "../api/chatbot";

interface SavedPromptsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPrompt: (prompt: string) => void;
}

export default function SavedPromptsDialog({ isOpen, onClose, onSelectPrompt }: SavedPromptsDialogProps) {
  const [savedPrompts, setSavedPrompts] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadSavedPrompts();
    }
  }, [isOpen]);

  const loadSavedPrompts = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await ChatbotAPI.getSavedPrompts();
      if (response.success) {
        setSavedPrompts(response.savedPrompts);
      }
    } catch (err: any) {
      console.error("Failed to load saved prompts:", err);
      setError(err.response?.data?.error || "Failed to load saved prompts");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePrompt = async (prompt: string) => {
    try {
      const response = await ChatbotAPI.deleteSavedPrompt(prompt);
      if (response.success) {
        setSavedPrompts(response.savedPrompts);
      }
    } catch (err: any) {
      console.error("Failed to delete prompt:", err);
      setError(err.response?.data?.error || "Failed to delete prompt");
    }
  };

  const handleSelectPrompt = (prompt: string) => {
    onSelectPrompt(prompt);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div class="saved-prompts-overlay" onClick={onClose}>
      <div class="saved-prompts-dialog" onClick={(e) => e.stopPropagation()}>
        <div class="dialog-header">
          <h3>
            <span class="oj-icon oj-ux-ico-bookmark"></span>
            Saved Prompts
          </h3>
          <button class="oj-button oj-button-text close-button" onClick={onClose}>
            <span class="oj-icon oj-ux-ico-close"></span>
          </button>
        </div>

        <div class="dialog-content">
          {isLoading && (
            <div class="loading-state">
              <span class="oj-icon oj-ux-ico-loading"></span>
              Loading saved prompts...
            </div>
          )}

          {error && (
            <div class="error-message">
              <span class="oj-icon oj-ux-ico-error"></span>
              {error}
            </div>
          )}

          {!isLoading && !error && savedPrompts.length === 0 && (
            <div class="empty-state">
              <span class="oj-icon oj-ux-ico-bookmark"></span>
              <p>No saved prompts yet</p>
              <p>Click the bookmark icon next to any message to save it for later use.</p>
            </div>
          )}

          {!isLoading && !error && savedPrompts.length > 0 && (
            <div class="prompts-list">
              {savedPrompts.map((prompt, index) => (
                <div key={index} class="prompt-item">
                  <div class="prompt-content" onClick={() => handleSelectPrompt(prompt)}>
                    <p>{prompt}</p>
                  </div>
                  <div class="prompt-actions">
                    <button
                      class="oj-button oj-button-text"
                      onClick={() => handleSelectPrompt(prompt)}
                      title="Use this prompt"
                    >
                      <span class="oj-icon oj-ux-ico-send"></span>
                    </button>
                    <button
                      class="oj-button oj-button-text"
                      onClick={() => handleDeletePrompt(prompt)}
                      title="Delete this prompt"
                    >
                      <span class="oj-icon oj-ux-ico-delete-circle"></span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div class="dialog-footer">
          <button class="oj-button oj-button-text" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
} 