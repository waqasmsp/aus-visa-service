import { useEffect, useState } from 'react';

const starterPrompts = ['Visitor visa help', 'Check visa options', 'Talk to support'];

type ChatMessage = {
  id: string;
  sender: 'visia' | 'user';
  text: string;
};

const initialMessages: ChatMessage[] = [
  {
    id: 'welcome',
    sender: 'visia',
    text: 'Hi, I am Visia. How can I help you today?'
  },
  {
    id: 'follow-up',
    sender: 'visia',
    text: 'I can guide you with visa types, documents, timelines, and application questions.'
  }
];

export function VisiaChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [showGreeting, setShowGreeting] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);

  useEffect(() => {
    const greetingTimer = window.setTimeout(() => {
      setShowGreeting(true);
    }, 900);

    return () => window.clearTimeout(greetingTimer);
  }, []);

  useEffect(() => {
    if (!showGreeting || isOpen) {
      return;
    }

    const hideTimer = window.setTimeout(() => {
      setShowGreeting(false);
    }, 6500);

    return () => window.clearTimeout(hideTimer);
  }, [showGreeting, isOpen]);

  const openChat = () => {
    setIsOpen(true);
    setShowGreeting(false);
  };

  const addUserMessage = (text: string) => {
    const trimmed = text.trim();

    if (!trimmed) {
      return;
    }

    setMessages((current) => [
      ...current,
      {
        id: `user-${current.length + 1}`,
        sender: 'user',
        text: trimmed
      },
      {
        id: `visia-${current.length + 2}`,
        sender: 'visia',
        text: 'I can help with that. Tell me your travel purpose or preferred visa type, and I will point you in the right direction.'
      }
    ]);
    setInputValue('');
  };

  return (
    <div className={`visia-chat${isOpen ? ' is-open' : ''}`}>
      {showGreeting && !isOpen && (
        <button type="button" className="visia-chat__greeting" onClick={openChat}>
          <span className="visia-chat__greeting-label">Visia</span>
          <strong>Hi, I am Visia</strong>
          <span>How can I help you today?</span>
        </button>
      )}

      {isOpen && (
        <section className="visia-chat__panel" aria-label="Visia support chat">
          <header className="visia-chat__header">
            <div className="visia-chat__identity">
              <span className="visia-chat__avatar visia-chat__avatar--small" aria-hidden="true">
                V
              </span>
              <div>
                <strong>Visia</strong>
                <span>Visa support assistant</span>
              </div>
            </div>
            <button type="button" className="visia-chat__close" onClick={() => setIsOpen(false)} aria-label="Close chat">
              x
            </button>
          </header>

          <div className="visia-chat__body">
            {messages.map((message) => (
              <article
                key={message.id}
                className={`visia-chat__message visia-chat__message--${message.sender}`}
              >
                {message.text}
              </article>
            ))}
          </div>

          <div className="visia-chat__prompts">
            {starterPrompts.map((prompt) => (
              <button key={prompt} type="button" className="visia-chat__prompt" onClick={() => addUserMessage(prompt)}>
                {prompt}
              </button>
            ))}
          </div>

          <form
            className="visia-chat__composer"
            onSubmit={(event) => {
              event.preventDefault();
              addUserMessage(inputValue);
            }}
          >
            <input
              type="text"
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
              placeholder="Ask Visia about your visa journey"
              aria-label="Message Visia"
            />
            <button type="submit">Send</button>
          </form>
        </section>
      )}

      <button
        type="button"
        className="visia-chat__launcher"
        onClick={() => {
          if (isOpen) {
            setIsOpen(false);
            return;
          }

          openChat();
        }}
        aria-label={isOpen ? 'Close Visia support chat' : 'Open Visia support chat'}
      >
        <span className="visia-chat__launcher-ring" aria-hidden="true" />
        <span className="visia-chat__avatar" aria-hidden="true">
          V
        </span>
      </button>
    </div>
  );
}
