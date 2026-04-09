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

function VisiaIcon() {
  return (
    <svg viewBox="0 0 24 24" role="img" aria-hidden="true" focusable="false">
      <rect x="5.25" y="7.25" width="13.5" height="10.5" rx="3" fill="currentColor" />
      <circle cx="9.25" cy="12.5" r="1.15" fill="#3b82f6" />
      <circle cx="14.75" cy="12.5" r="1.15" fill="#3b82f6" />
      <rect x="10.1" y="15.1" width="3.8" height="1.3" rx="0.65" fill="#3b82f6" />
      <rect x="11.35" y="3.5" width="1.3" height="3" rx="0.65" fill="currentColor" />
      <circle cx="12" cy="2.8" r="1.15" fill="currentColor" />
      <rect x="3.25" y="10.9" width="1.5" height="3.3" rx="0.75" fill="currentColor" />
      <rect x="19.25" y="10.9" width="1.5" height="3.3" rx="0.75" fill="currentColor" />
    </svg>
  );
}

export function VisiaChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [showGreeting, setShowGreeting] = useState(false);
  const [isGreetingDismissed, setIsGreetingDismissed] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);

  useEffect(() => {
    const greetingTimer = window.setTimeout(() => {
      setShowGreeting(true);
    }, 900);

    return () => window.clearTimeout(greetingTimer);
  }, []);

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
      {showGreeting && !isOpen && !isGreetingDismissed && (
        <div
          className="visia-chat__greeting"
          role="button"
          tabIndex={0}
          onClick={openChat}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              openChat();
            }
          }}
        >
          <button
            type="button"
            className="visia-chat__greeting-close"
            aria-label="Dismiss greeting"
            onClick={(event) => {
              event.stopPropagation();
              setIsGreetingDismissed(true);
            }}
          >
            x
          </button>
          <span className="visia-chat__greeting-label">Visia</span>
          <strong>Hi, I am Visia</strong>
          <span>How can I help you today?</span>
        </div>
      )}

      {isOpen && (
        <section className="visia-chat__panel" aria-label="Visia support chat">
          <header className="visia-chat__header">
            <div className="visia-chat__identity">
              <span className="visia-chat__avatar visia-chat__avatar--small" aria-hidden="true">
                <VisiaIcon />
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
          <VisiaIcon />
        </span>
      </button>
    </div>
  );
}
