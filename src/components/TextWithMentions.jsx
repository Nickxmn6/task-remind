import React from 'react';

export function TextWithMentions({ text }) {
  if (!text) return null;

  // Split by @username pattern
  // Matches '@' followed by alphanumeric characters or underscores
  const parts = text.split(/(@[a-zA-Z0-9_]+)/g);

  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('@')) {
          return (
            <span 
              key={i} 
              className="font-semibold text-blue-400 bg-blue-400/10 px-1 rounded cursor-pointer hover:bg-blue-400/20 hover:text-blue-300 transition-colors"
            >
              {part}
            </span>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}
