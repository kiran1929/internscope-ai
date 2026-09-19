'use client';

import React, { useMemo } from 'react';

interface RichDescriptionProps {
  content?: string | null;
  className?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function unescapeHtml(str: string): string {
  let result = str;
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
      .replace(/&#(\d+);/g, (_: string, code: string) => String.fromCharCode(Number(code)))
      .replace(/&amp;/gi, '&');
  }
  return result;
}

/** Strip all HTML tags and collapse whitespace to plain text. */
function htmlToPlain(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/?(p|div|section|article|header|footer|li|ul|ol|h[1-6])\b[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** Section heading keywords that we promote to labels in bullet view. */
const SECTION_HEADING_RE =
  /^(about|who we are|what you('?ll| will) do|responsibilities|requirements|qualifications|preferred|nice to have|benefits|what we offer|about the role|the role|your role|minimum qualifications|preferred qualifications|what you bring)\b/i;

const ALLCAPS_HEADING_RE = /^[A-Z][A-Z0-9\s&/''\-]{3,}$/;

/** True for short lines that look like a section header. */
function isHeading(line: string): boolean {
  if (line.length > 90 || line.endsWith('.') || line.endsWith(',')) return false;
  return SECTION_HEADING_RE.test(line) || ALLCAPS_HEADING_RE.test(line);
}

/** True for lines that are explicit bullet markers. */
function isBulletLine(line: string): boolean {
  return /^[-*•●▪◦‣►▸→]\s+/.test(line);
}

function stripBulletMarker(line: string): string {
  return line.replace(/^[-*•●▪◦‣►▸→]\s+/, '').trim();
}

// ─── Core: plain text → structured sections ──────────────────────────────────

interface Section {
  heading: string | null;
  bullets: string[];
}

function parseSections(plain: string): Section[] {
  const lines = plain.split('\n').map((l) => l.trim()).filter(Boolean);
  const sections: Section[] = [];
  let current: Section = { heading: null, bullets: [] };

  for (const line of lines) {
    if (isHeading(line)) {
      // Flush current section if it has content
      if (current.bullets.length > 0 || current.heading) {
        sections.push(current);
      }
      current = { heading: line, bullets: [] };
      continue;
    }

    if (isBulletLine(line)) {
      current.bullets.push(stripBulletMarker(line));
      continue;
    }

    // Non-heading prose line → treat as a bullet-style sentence
    // Short lines (≤ 120 chars) become bullets; longer paragraphs get split by sentence
    if (line.length <= 120) {
      current.bullets.push(line);
    } else {
      // Split on '. ' boundaries to create multiple short bullets
      const sentences = line
        .split(/(?<=\.)\s+(?=[A-Z])/)
        .map((s) => s.trim())
        .filter(Boolean);
      current.bullets.push(...sentences);
    }
  }

  if (current.bullets.length > 0 || current.heading) {
    sections.push(current);
  }

  // If nothing structured was found, wrap all content as one section
  if (sections.length === 0 && lines.length > 0) {
    sections.push({ heading: null, bullets: lines });
  }

  return sections;
}

// ─── Component ───────────────────────────────────────────────────────────────

export const RichDescription: React.FC<RichDescriptionProps> = ({
  content,
  className = '',
}) => {
  const sections = useMemo((): Section[] => {
    if (!content?.trim()) return [];

    const unescaped = unescapeHtml(content.trim());
    const looksLikeHtml =
      /&lt;[a-z]/i.test(content) || /<[a-z][\s\S]*>/i.test(unescaped);

    const plain = looksLikeHtml ? htmlToPlain(unescaped) : unescaped;
    return parseSections(plain);
  }, [content]);

  if (sections.length === 0) {
    return (
      <p className="text-xs text-text-muted italic">
        No description provided for this opportunity yet.
      </p>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {sections.map((section, si) => (
        <div key={si} className="space-y-2">
          {section.heading && (
            <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted border-b border-border-subtle pb-1">
              {section.heading}
            </p>
          )}
          <ul className="space-y-1.5">
            {section.bullets.map((bullet, bi) => (
              <li key={bi} className="flex items-start gap-2">
                <span className="mt-[5px] shrink-0 w-1.5 h-1.5 rounded-full bg-primary/60" />
                <span className="text-xs text-foreground/85 leading-relaxed">{bullet}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
};
