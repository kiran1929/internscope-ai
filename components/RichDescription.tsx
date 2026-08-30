'use client';

import React, { useMemo } from 'react';

interface RichDescriptionProps {
  content?: string | null;
  className?: string;
}

/**
 * Unescapes common HTML entities that come from job board APIs (e.g. &lt;h2&gt; -> <h2>).
 */
function unescapeHtml(htmlStr: string): string {
  let result = htmlStr;
  
  // Repeatedly unescape in case of double-encoding
  for (let i = 0; i < 2; i++) {
    if (!/&[a-zA-Z0-9#]+;/.test(result)) break;
    result = result
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&apos;/g, "'")
      .replace(/&nbsp;/g, ' ')
      .replace(/&#x2F;/gi, '/')
      .replace(/&#x27;/gi, "'")
      .replace(/&#x3D;/gi, '=');
  }

  return result;
}

/**
 * Sanitizes HTML by stripping dangerous tags and inline javascript event handlers.
 */
function sanitizeHtml(rawHtml: string): string {
  // Strip script, iframe, object, embed, form, link, style tags and their contents
  let clean = rawHtml.replace(/<(script|iframe|object|embed|form|link|style)\b[^<]*(?:(?!<\/\1>)<[^<]*)*<\/\1>/gi, '');
  
  // Strip self-closing or lone forbidden tags
  clean = clean.replace(/<\/?(script|iframe|object|embed|form|link|style|meta|base)\b[^>]*>/gi, '');

  // Strip on* event attributes (e.g. onload, onclick, onerror)
  clean = clean.replace(/\son\w+\s*=\s*(['"]).*?\1/gi, '');
  clean = clean.replace(/\son\w+\s*=\s*[^>\s]+/gi, '');

  // Strip javascript: URLs in href
  clean = clean.replace(/href\s*=\s*(['"])javascript:.*?\1/gi, 'href="#"');

  return clean;
}

export const RichDescription: React.FC<RichDescriptionProps> = ({
  content,
  className = '',
}) => {
  const formattedHtml = useMemo(() => {
    if (!content || !content.trim()) return null;

    const unescaped = unescapeHtml(content.trim());
    const isHtml = /<[a-z][\s\S]*>/i.test(unescaped);

    if (isHtml) {
      return sanitizeHtml(unescaped);
    }

    // Convert plain text into clean HTML paragraphs and lists
    const paragraphs = unescaped.split(/\n\s*\n/);
    return paragraphs
      .map((p) => {
        const trimmed = p.trim();
        if (!trimmed) return '';
        // If line starts with bullet
        if (/^[-*•]\s+/m.test(trimmed)) {
          const items = trimmed
            .split(/\n/)
            .map((line) => line.replace(/^[-*•]\s+/, '').trim())
            .filter(Boolean)
            .map((item) => `<li>${item}</li>`)
            .join('');
          return `<ul>${items}</ul>`;
        }
        return `<p>${trimmed.replace(/\n/g, '<br/>')}</p>`;
      })
      .filter(Boolean)
      .join('');
  }, [content]);

  if (!formattedHtml) {
    return <p className="text-xs text-zinc-500 italic">No description provided.</p>;
  }

  return (
    <div
      className={`rich-description text-xs text-zinc-300 leading-relaxed space-y-3 font-sans 
        [&_h1]:text-sm [&_h1]:font-bold [&_h1]:text-white [&_h1]:mt-4 [&_h1]:mb-2 [&_h1]:border-b [&_h1]:border-zinc-800 [&_h1]:pb-1
        [&_h2]:text-xs [&_h2]:font-bold [&_h2]:uppercase [&_h2]:tracking-wider [&_h2]:text-white [&_h2]:mt-4 [&_h2]:mb-1.5 [&_h2]:border-b [&_h2]:border-zinc-850/60 [&_h2]:pb-1
        [&_h3]:text-xs [&_h3]:font-bold [&_h3]:text-zinc-100 [&_h3]:mt-3 [&_h3]:mb-1
        [&_h4]:text-xs [&_h4]:font-semibold [&_h4]:text-zinc-200 [&_h4]:mt-2
        [&_p]:leading-relaxed [&_p]:text-zinc-300
        [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_ul]:my-2
        [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-1.5 [&_ol]:my-2
        [&_li]:text-zinc-300 [&_li]:leading-relaxed
        [&_strong]:text-white [&_strong]:font-semibold
        [&_b]:text-white [&_b]:font-semibold
        [&_em]:text-zinc-200 [&_em]:italic
        [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2 [&_a]:hover:text-primary-light
        [&_blockquote]:border-l-2 [&_blockquote]:border-primary/40 [&_blockquote]:pl-3 [&_blockquote]:text-zinc-400 [&_blockquote]:italic
        ${className}`}
      dangerouslySetInnerHTML={{ __html: formattedHtml }}
    />
  );
};
