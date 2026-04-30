import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface MarkdownRendererProps {
  content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  // 预处理：移除多余的空行（3个或更多连续换行）
  const normalizedContent = content.replace(/\n{3,}/g, '\n\n');

  return (
    <div className="markdown-content">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          code({ node, inline, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || '');
            const language = match ? match[1] : '';

            return !inline && language ? (
              <SyntaxHighlighter
                style={oneLight}
                language={language}
                PreTag="div"
                className="code-block"
                customStyle={{
                  background: '#f5f5f5',
                  borderRadius: '0.5rem',
                  padding: '0.75rem',
                  fontSize: '0.8125rem',
                  marginTop: '0.25rem',
                  marginBottom: '0.25rem',
                  overflow: 'auto',
                  lineHeight: '1.4',
                }}
              >
                {String(children).replace(/\n$/, '')}
              </SyntaxHighlighter>
            ) : (
              <code
                className="inline-code"
                style={{
                  background: '#f0f0f0',
                  padding: '0.2rem 0.4rem',
                  borderRadius: '0.25rem',
                  fontSize: '0.875em',
                  fontFamily: 'monospace',
                }}
                {...props}
              >
                {children}
              </code>
            );
          },
          p({ children }) {
            return <p className="markdown-paragraph">{children}</p>;
          },
          h1({ children }) {
            return <h1 className="markdown-h1">{children}</h1>;
          },
          h2({ children }) {
            return <h2 className="markdown-h2">{children}</h2>;
          },
          h3({ children }) {
            return <h3 className="markdown-h3">{children}</h3>;
          },
          ul({ children }) {
            return <ul className="markdown-list">{children}</ul>;
          },
          ol({ children }) {
            return <ol className="markdown-list numbered">{children}</ol>;
          },
          li({ children }) {
            return <li className="markdown-item">{children}</li>;
          },
          blockquote({ children }) {
            return (
              <blockquote className="markdown-blockquote">{children}</blockquote>
            );
          },
          a({ children, href }) {
            return (
              <a
                href={href}
                className="markdown-link"
                target="_blank"
                rel="noopener noreferrer"
              >
                {children}
              </a>
            );
          },
          table({ children }) {
            return <div className="markdown-table-wrapper">{children}</div>;
          },
          strong({ children }) {
            return <strong className="markdown-bold">{children}</strong>;
          },
          em({ children }) {
            return <em className="markdown-italic">{children}</em>;
          },
        }}
      >
        {normalizedContent}
      </ReactMarkdown>
    </div>
  );
}
