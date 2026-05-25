import React from 'react';

export default function MentionAutocompleteBar({ text, users, onSelect, onCancel }) {
  // Check if the last word being typed starts with @
  const words = text.split(/\s+/);
  const lastWord = words[words.length - 1];

  if (!lastWord.startsWith('@')) return null;

  const query = lastWord.substring(1).toLowerCase();
  
  // Filter users by query
  const filteredUsers = users.filter(u => 
    u.username && u.username.toLowerCase().includes(query)
  );

  if (filteredUsers.length === 0) return null;

  const handleSelect = (username) => {
    // Replace the last word with the selected username (stripped of spaces)
    const newWords = [...words];
    const cleanUsername = username.replace(/\s+/g, '');
    newWords[newWords.length - 1] = `@${cleanUsername} `;
    onSelect(newWords.join(' '));
  };

  return (
    <div className="absolute bottom-full left-0 w-full mb-1 bg-zinc-900/90 backdrop-blur-md border border-white/10 rounded-xl shadow-2xl p-1.5 flex gap-1.5 overflow-x-auto z-50 scrollbar-none animate-slide-up">
      {filteredUsers.map(u => (
        <button
          key={u.id}
          type="button"
          onClick={() => handleSelect(u.username)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/10 transition-colors flex-shrink-0"
        >
          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-[10px]">
            {u.username[0].toUpperCase()}
          </div>
          <span className="text-sm font-semibold text-white/90">{u.username}</span>
        </button>
      ))}
      {/* Close button to dismiss */}
      <button 
        type="button"
        onClick={onCancel}
        className="ml-auto px-2 text-white/40 hover:text-white/80"
      >
        ✕
      </button>
    </div>
  );
}
