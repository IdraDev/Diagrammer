import * as React from 'react'
import { cn } from './utils'

/**
 * Tiny, self-contained inline markdown renderer.
 *
 * Supports a small, predictable subset:
 *
 *   **bold**          → <strong>
 *   *italic*          → <em>
 *   _italic_          → <em>
 *   `code`            → <code>      (no nested formatting inside)
 *   ~~strike~~        → <s>
 *   [text](url)       → <a target=_blank rel=noreferrer noopener>
 *
 * No paragraphs, headings, lists, or raw HTML. Markup beyond these is
 * rendered literally — labels in a graph should stay short and visual.
 */

// One regex with alternation. Group indices map to feature kinds (see below).
const TOKEN_RE =
  /(\*\*([^\n]+?)\*\*)|(\*([^\n]+?)\*)|(_([^\n]+?)_)|(`([^`\n]+?)`)|(~~([^\n]+?)~~)|(\[([^\]\n]+?)\]\(([^)\n]+?)\))/g

function parseInline(
  text: string,
  keyPrefix: string,
): React.ReactNode[] {
  const out: React.ReactNode[] = []
  let lastIdx = 0
  let i = 0
  // Avoid sharing lastIndex across calls.
  const re = new RegExp(TOKEN_RE.source, 'g')
  let match: RegExpExecArray | null
  while ((match = re.exec(text)) !== null) {
    if (match.index > lastIdx) {
      out.push(text.slice(lastIdx, match.index))
    }
    const k = `${keyPrefix}-${i++}`
    if (match[1] !== undefined) {
      out.push(<strong key={k}>{parseInline(match[2], k)}</strong>)
    } else if (match[3] !== undefined) {
      out.push(<em key={k}>{parseInline(match[4], k)}</em>)
    } else if (match[5] !== undefined) {
      out.push(<em key={k}>{parseInline(match[6], k)}</em>)
    } else if (match[7] !== undefined) {
      out.push(
        <code
          key={k}
          className="rounded-sm bg-[color-mix(in_oklab,currentColor_12%,transparent)] px-[3px] py-[1px] font-mono text-[0.92em]"
        >
          {match[8]}
        </code>,
      )
    } else if (match[9] !== undefined) {
      out.push(<s key={k}>{parseInline(match[10], k)}</s>)
    } else if (match[11] !== undefined) {
      out.push(
        <a
          key={k}
          href={match[13]}
          target="_blank"
          rel="noreferrer noopener"
          className="underline underline-offset-2"
        >
          {parseInline(match[12], k)}
        </a>,
      )
    }
    lastIdx = match.index + match[0].length
  }
  if (lastIdx < text.length) {
    out.push(text.slice(lastIdx))
  }
  return out
}

export interface InlineMarkdownProps
  extends Omit<React.HTMLAttributes<HTMLSpanElement>, 'children'> {
  text: string
  /** When true, falls back to a plain text span (used for inputs/diff views). */
  asPlain?: boolean
}

export function InlineMarkdown({
  text,
  asPlain,
  className,
  ...rest
}: InlineMarkdownProps) {
  if (asPlain) {
    return (
      <span className={className} {...rest}>
        {text}
      </span>
    )
  }
  return (
    <span className={cn(className)} {...rest}>
      {parseInline(text, 'md')}
    </span>
  )
}

/**
 * Strip inline markdown delimiters, returning plain text. Used for tab
 * titles, slugified filenames, and other contexts that can't render
 * formatting.
 */
export function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*([^\n]+?)\*\*/g, '$1')
    .replace(/\*([^\n]+?)\*/g, '$1')
    .replace(/_([^\n]+?)_/g, '$1')
    .replace(/`([^`\n]+?)`/g, '$1')
    .replace(/~~([^\n]+?)~~/g, '$1')
    .replace(/\[([^\]\n]+?)\]\(([^)\n]+?)\)/g, '$1')
}
