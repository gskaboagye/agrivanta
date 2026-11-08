import "server-only";
import DOMPurify from "isomorphic-dompurify";

export function sanitizeArticleHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
    FORBID_TAGS: [
      "script",
      "style",
      "iframe",
      "object",
      "embed",
      "form",
      "input",
      "button",
    ],
    FORBID_ATTR: [
      "style",
      "onerror",
      "onclick",
      "onload",
    ],
    ALLOW_DATA_ATTR: false,
  });
}