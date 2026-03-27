import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';

interface MarkdownMessageProps {
  content: string;
  className?: string;
  isUserMessage?: boolean;
}

export function MarkdownMessage({ content, className, isUserMessage = false }: MarkdownMessageProps) {
  return (
    <div className={cn('text-sm break-words overflow-hidden [overflow-wrap:anywhere]', className)}>
      <ReactMarkdown
        components={{
        // Links - open in new tab with styling
        a: ({ href, children }) => (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              'underline underline-offset-2 hover:opacity-80 transition-opacity',
              isUserMessage ? 'text-primary-foreground' : 'text-primary font-medium'
            )}
          >
            {children}
          </a>
        ),
        // Bold text
        strong: ({ children }) => (
          <strong className="font-semibold">{children}</strong>
        ),
        // Italic text
        em: ({ children }) => (
          <em className="italic">{children}</em>
        ),
        // Paragraphs with proper spacing
        p: ({ children }) => (
          <p className="mb-2 last:mb-0 whitespace-pre-wrap">{children}</p>
        ),
        // Unordered lists
        ul: ({ children }) => (
          <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>
        ),
        // Ordered lists
        ol: ({ children }) => (
          <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>
        ),
        // List items
        li: ({ children }) => (
          <li className="text-sm">{children}</li>
        ),
        // Headings
        h1: ({ children }) => (
          <h1 className="text-base font-bold mb-2">{children}</h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-sm font-bold mb-1">{children}</h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-sm font-semibold mb-1">{children}</h3>
        ),
        // Code blocks
        code: ({ children }) => (
          <code className={cn(
            'px-1 py-0.5 rounded text-xs font-mono',
            isUserMessage ? 'bg-primary-foreground/20' : 'bg-muted-foreground/10'
          )}>
            {children}
          </code>
        ),
        // Block quotes
        blockquote: ({ children }) => (
          <blockquote className={cn(
            'border-l-2 pl-3 italic my-2',
            isUserMessage ? 'border-primary-foreground/50' : 'border-primary/50'
          )}>
            {children}
          </blockquote>
        ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
