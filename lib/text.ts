/** 以 code point 為單位截斷，避免把 emoji（surrogate pair）切成無效字元 */
export function truncateByCodePoint(text: string, max: number): string {
  const points = [...text];
  return points.length <= max ? text : points.slice(0, max).join("");
}

/** 移除未配對的 surrogate（例如被硬切一半的 emoji），保留完整字元 */
export function stripLoneSurrogates(text: string): string {
  return text.replace(
    /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g,
    "",
  );
}
