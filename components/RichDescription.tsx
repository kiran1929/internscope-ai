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
  for (let i = 0; i < 3; i++) {
    if (!/&[a-zA-Z0-9#]+;/.test(result)) break;
    result = result
      .replace(/&nbsp;/gi, ' ')
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>')
      .replace(/&quot;/gi, '"')
      .replace(/&#39;/g, "'")
      .replace(/&apos;/gi, "'")
      .replace(/&#x2F;/gi, '/')
      .replace(/&#x27;/gi, "'")
      .replace(/&#x3D;/gi, '=')
      .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
      .replace(/&amp;/gi, '&');
  }

  return result;
}

/**
 * Sanitizes HTML by stripping dangerous tags, event handlers, and inline colors
 * that break dark/light UI contrast.
 */
function sanitizeHtml(rawHtml: string): string {
  let clean = rawHtml.replace(
    /<(script|iframe|object|embed|form|link|style)\b[^<]*(?:(?!<\/\1>)<[^<]*)*<\/\1>/gi,
    ''
  );

  clean = clean.replace(
    /<\/?(script|iframe|object|embed|form|link|style|meta|base)\b[^>]*>/gi,
    ''
  );

  // Strip on* event attributes
  clean = clean.replace(/\son\w+\s*=\s*(['"]).*?\1/gi, '');
  clean = clean.replace(/\son\w+\s*=\s*[^>\s]+/gi, '');

  // Strip javascript: URLs
  clean = clean.replace(/href\s*=\s*(['"])javascript:.*?\1/gi, 'href="#"');

  // Strip inline colors / backgrounds that clash with theme (black text on dark cards, etc.)
  clean = clean.replace(/\sstyle\s*=\s*(['"])(.*?)\1/gi, (_match, quote: string, style: string) => {
    const kept = style
      .split(';')
      .map((rule) => rule.trim())
      .filter(Boolean)
      .filter((rule) => {
        const prop = rule.split(':')[0]?.trim().toLowerCase() || '';
        return ![
          'color',
          'background',
          'background-color',
          'background-image',
          'font-size',
          'font-family',
          'line-height',
        ].includes(prop);
      })
      .join('; ');
    return kept ? ` style=${quote}${kept}${quote}` : '';
  });

  // Drop empty class-only wrappers noise from ATS HTML where helpful
  clean = clean.replace(/\sclass\s*=\s*(['"]).*?\1/gi, '');

  return clean;
}

function plainTextToHtml(text: string): string {
  const normalized = text.replace(/\r\n/g, '\n').trim();
  if (!normalized) return '';

  // Prefer blank-line paragraphs; fall back to single-newline blocks for ATS dumps
  const chunks = normalized.includes('\n\n')
    ? normalized.split(/\n\s*\n/)
    : normalized.split(/\n/);

  const htmlParts: string[] = [];
  let listItems: string[] = [];

  const flushList = () => {
    if (listItems.length === 0) return;
    htmlParts.push(`<ul>${listItems.map((item) => `<li>${item}</li>`).join('')}</ul>`);
    listItems = [];
  };

  for (const raw of chunks) {
    const trimmed = raw.trim();
    if (!trimmed) continue;

    if (/^[-*•●▪]\s+/.test(trimmed)) {
      listItems.push(trimmed.replace(/^[-*•●▪]\s+/, '').trim());
      continue;
    }

    flushList();

    if (/^[-*•●▪]\s+/m.test(trimmed) && trimmed.includes('\n')) {
      const items = trimmed
        .split(/\n/)
        .map((line) => line.replace(/^[-*•●▪]\s+/, '').trim())
        .filter(Boolean);
      htmlParts.push(`<ul>${items.map((item) => `<li>${item}</li>`).join('')}</ul>`);
      continue;
    }

    // Short ALL-CAPS / Title lines → section headings
    if (
      trimmed.length < 80 &&
      !trimmed.endsWith('.') &&
      (/^[A-Z0-9][A-Z0-9\s&/’'\-]{2,}$/.test(trimmed) ||
        /^(about|who we are|what you.?ll do|responsibilities|requirements|qualifications|benefits|nice to have|about the role)\b/i.test(
          trimmed
        ))
    ) {
      htmlParts.push(`<h3>${trimmed}</h3>`);
      continue;
    }

    htmlParts.push(`<p>${trimmed.replace(/\n/g, '<br/>')}</p>`);
  }

  flushList();
  return htmlParts.join('');
}

export const RichDescription: React.FC<RichDescriptionProps> = ({
  content,
  className = '',
}) => {
  const formattedHtml = useMemo(() => {
    if (!content || !content.trim()) return null;

    const unescaped = unescapeHtml(content.trim());
    const looksEscaped = /&lt;[a-z]/i.test(content);
    const isHtml = looksEscaped || /<[a-z][\s\S]*>/i.test(unescaped);

    if (isHtml) {
      return sanitizeHtml(unescaped);
    }

    return plainTextToHtml(unescaped);
  }, [content]);

  if (!formattedHtml) {
    return (
      <p className="text-sm text-text-muted italic">
        No description provided for this opportunity yet.
      </p>
    );
  }

  return (
    <div
      className={`rich-description text-sm text-foreground/90 leading-relaxed space-y-3 font-sans max-w-none
        [&_*]:!text-inherit
        [&_h1]:!text-foreground [&_h1]:text-base [&_h1]:font-bold [&_h1]:mt-5 [&_h1]:mb-2 [&_h1]:border-b [&_h1]:border-border-subtle [&_h1]:pb-1.5
        [&_h2]:!text-foreground [&_h2]:text-sm [&_h2]:font-bold [&_h2]:uppercase [&_h2]:tracking-wider [&_h2]:mt-5 [&_h2]:mb-2 [&_h2]:border-b [&_h2]:border-border-subtle [&_h2]:pb-1
        [&_h3]:!text-foreground [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:mt-4 [&_h3]:mb-1.5
        [&_h4]:!text-foreground [&_h4]:text-sm [&_h4]:font-semibold [&_h4]:mt-3
        [&_p]:!text-foreground/85 [&_p]:leading-relaxed [&_p]:my-2
        [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_ul]:my-3
        [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-1.5 [&_ol]:my-3
        [&_li]:!text-foreground/85 [&_li]:leading-relaxed
        [&_strong]:!text-foreground [&_strong]:font-semibold
        [&_b]:!text-foreground [&_b]:font-semibold
        [&_em]:!text-foreground/80 [&_em]:italic
        [&_a]:!text-primary [&_a]:underline [&_a]:underline-offset-2 hover:[&_a]:opacity-90
        [&_blockquote]:border-l-2 [&_blockquote]:border-primary/40 [&_blockquote]:pl-3 [&_blockquote]:!text-text-muted [&_blockquote]:italic
        [&_span]:!text-inherit [&_div]:!text-inherit
        ${className}`}
      dangerouslySetInnerHTML={{ __html: formattedHtml }}
    />
  );
};
