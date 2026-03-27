import React from 'react';

interface LinkifyTextProps {
  text: string;
  className?: string;
}

// Regex to match URLs (http, https, www) and phone/whatsapp links
const URL_REGEX = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi;

export function LinkifyText({ text, className }: LinkifyTextProps) {
  const parts = text.split(URL_REGEX);
  
  return (
    <span className={className}>
      {parts.map((part, index) => {
        if (URL_REGEX.test(part)) {
          // Reset regex lastIndex since we're reusing it
          URL_REGEX.lastIndex = 0;
          const href = part.startsWith('http') ? part : `https://${part}`;
          return (
            <a
              key={index}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline break-all"
              onClick={(e) => e.stopPropagation()}
            >
              {part}
            </a>
          );
        }
        return <React.Fragment key={index}>{part}</React.Fragment>;
      })}
    </span>
  );
}
