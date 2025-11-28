import ReactMarkdown, { Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface MarkdownMessageProps {
  content: string;
}

export function MarkdownMessage({ content }: MarkdownMessageProps) {
  const components: Partial<Components> = {
        // インラインコード
        code({ className, children }) {
          const isInline = !className
          return isInline ? (
            <code className="px-1.5 py-0.5 rounded bg-muted/60 font-mono text-sm border">
              {children}
            </code>
          ) : (
            <pre className="my-3 p-4 rounded-lg bg-muted/40 border overflow-x-auto">
              <code className="font-mono text-sm">{children}</code>
            </pre>
          )
        },

        // 段落
        p: ({ children }) => <p className="my-2 leading-relaxed">{children}</p>,

        // 見出し
        h1: ({ children }) => <h1 className="text-2xl font-bold mt-4 mb-2">{children}</h1>,
        h2: ({ children }) => <h2 className="text-xl font-bold mt-3 mb-2">{children}</h2>,
        h3: ({ children }) => <h3 className="text-lg font-bold mt-2 mb-1">{children}</h3>,

        // リスト
        ul: ({ children }) => (
          <ul className="list-disc list-inside my-2 space-y-1 pl-4">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="list-decimal list-inside my-2 space-y-1 pl-4">{children}</ol>
        ),
        li: ({ children }) => (
          <li className="text-sm leading-relaxed">{children}</li>
        ),

        // テーブル (GFM)
        table: ({ children }) => (
          <div className="my-3 overflow-x-auto">
            <table className="min-w-full border border-border rounded-lg">
              {children}
            </table>
          </div>
        ),
        th: ({ children }) => (
          <th className="border border-border bg-muted/50 px-4 py-2 text-left font-semibold">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="border border-border px-4 py-2">{children}</td>
        ),

        // 引用
        blockquote: ({ children }) => (
          <blockquote className="border-l-4 border-muted-foreground/30 pl-4 italic my-3">
            {children}
          </blockquote>
        ),

        // リンク
        a: ({ href, children }) => (
          <a href={href} className="text-primary underline hover:text-primary/80" target="_blank" rel="noopener noreferrer">
            {children}
          </a>
        ),
      }
  
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={components}
    >
      {content}
    </ReactMarkdown>
  )
}
