import React from 'react'
import { MessageList } from './MessageList'
import { InputField } from './InputField'
import { ModelPicker } from './ModelPicker'

interface ActiveChatAreaProps {
  messages: any[];
  visibleStreamingContent: string;
  isStreamingThisChat: boolean;
  retryLastMessage: () => void;
  sendMessage: (msg: string) => void;
  stopInference: () => void;
  isStreaming: boolean;
  model: string;
  availableModels: any[];
  setModel: (model: string) => void;
  inputValue: string;
  setInputValue: (val: string) => void;
}

export const ActiveChatArea: React.FC<ActiveChatAreaProps> = ({
  messages,
  visibleStreamingContent,
  isStreamingThisChat,
  retryLastMessage,
  sendMessage,
  stopInference,
  isStreaming,
  model,
  availableModels,
  setModel,
  inputValue,
  setInputValue
}) => {
  return (
    <>
      {/* Scrollable Message History */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        overflowY: 'auto',
        scrollBehavior: 'smooth',
        width: '100%',
      }}>
        <div style={{ width: '100%', maxWidth: '850px', flex: 1, display: 'flex', flexDirection: 'column' }}>
          <MessageList
            messages={messages}
            streamingContent={visibleStreamingContent}
            isStreaming={isStreamingThisChat}
            onRetry={retryLastMessage}
          />
        </div>
      </div>

      {/* Pinned Bottom Input Bar Card */}
      <div style={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '0 24px 24px 24px',
        background: 'linear-gradient(180deg, transparent 0%, var(--color-bg-canvas) 20%)',
        zIndex: 10
      }}>
        <div style={{ width: '100%', maxWidth: '850px', display: 'flex', flexDirection: 'column' }}>
          <InputField
            onSend={sendMessage}
            onStop={stopInference}
            disabled={isStreaming}
            isStreaming={isStreamingThisChat}
            placeholder={`Message ${model}...`}
            value={inputValue}
            onChange={setInputValue}
            modelPicker={
              <ModelPicker
                model={model}
                availableModels={availableModels}
                onSelect={setModel}
                disabled={isStreaming}
              />
            }
          />
        </div>
      </div>
    </>
  )
}
