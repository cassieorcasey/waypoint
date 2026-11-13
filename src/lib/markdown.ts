// Parser markdown kecil untuk catatan materi. Tanpa dependensi, hasilnya data biasa (bukan HTML),
// jadi dirender sebagai elemen React dan tidak ada celah HTML mentah.
//
// Didukung: judul (#, ##, ###), paragraf, daftar bertingkat (- dan 1.), blok kode berpagar (```bahasa),
// kutipan (>), tabel (| a | b |), garis (---). Inline: `kode`, **tebal**, *miring*, [teks](https://tautan).
// Tidak didukung (sengaja): HTML mentah, gambar, blok kode di dalam daftar, baris kosong di tengah daftar.

export interface ListItem { text: string; sub?: ListNode }
export interface ListNode { ordered: boolean; items: ListItem[] }

export type Block =
  | { t: 'h'; level: 2 | 3; text: string }
  | { t: 'p'; text: string }
  | { t: 'code'; lang: string; code: string }
  | { t: 'list'; list: ListNode }
  | { t: 'quote'; text: string }
  | { t: 'table'; head: string[]; rows: string[][]; align: ('left' | 'right' | 'center')[] }
  | { t: 'hr' };

const LIST_RE = /^(\s*)([-*+]|\d+[.)])\s+(.*)$/;
const FENCE_RE = /^\s*```\s*([\w+-]*)\s*$/;
const HEADING_RE = /^(#{1,4})\s+(.*?)\s*#*\s*$/;
const TABLE_SEP_RE = /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)*\|?\s*$/;

const cells = (line: string) => line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map(c => c.trim());

function parseList(lines: string[], start: number): [ListNode, number] {
  const first = LIST_RE.exec(lines[start])!;
  const root: ListNode = { ordered: /\d/.test(first[2]), items: [] };
  const stack: { indent: number; list: ListNode }[] = [{ indent: first[1].replace(/\t/g, '    ').length, list: root }];
  let i = start;
  while (i < lines.length) {
    const m = LIST_RE.exec(lines[i]);
    if (m) {
      const indent = m[1].replace(/\t/g, '    ').length;
      // Ganti jenis penanda (poin ke nomor atau sebaliknya) di tingkat paling luar = daftar baru.
      if (indent <= stack[0].indent && /\d/.test(m[2]) !== root.ordered) break;
      while (stack.length > 1 && indent < stack[stack.length - 1].indent) stack.pop();
      let top = stack[stack.length - 1];
      if (indent > top.indent && top.list.items.length) {
        const parent = top.list.items[top.list.items.length - 1];
        parent.sub ??= { ordered: /\d/.test(m[2]), items: [] };
        stack.push({ indent, list: parent.sub });
        top = stack[stack.length - 1];
      }
      top.list.items.push({ text: m[3] });
      i++;
    } else if (/^\s+\S/.test(lines[i]) && !FENCE_RE.test(lines[i])) {
      // Lanjutan baris dari item sebelumnya.
      const items = stack[stack.length - 1].list.items;
      items[items.length - 1].text += ' ' + lines[i].trim();
      i++;
    } else break;
  }
  return [root, i];
}

const startsBlock = (line: string, next: string | undefined) =>
  FENCE_RE.test(line) || HEADING_RE.test(line) || LIST_RE.test(line) || /^\s*>/.test(line) ||
  /^\s*(-{3,}|\*{3,})\s*$/.test(line) || (/^\s*\|/.test(line) && next !== undefined && TABLE_SEP_RE.test(next));

export function parseMarkdown(src: string): Block[] {
  const lines = src.replace(/\r\n?/g, '\n').split('\n');
  const out: Block[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i++; continue; }

    const fence = FENCE_RE.exec(line);
    if (fence) {
      const code: string[] = [];
      i++;
      while (i < lines.length && !/^\s*```\s*$/.test(lines[i])) code.push(lines[i++]);
      i++; // pagar penutup
      out.push({ t: 'code', lang: fence[1], code: code.join('\n') });
      continue;
    }

    const h = HEADING_RE.exec(line);
    if (h) {
      out.push({ t: 'h', level: h[1].length <= 2 ? 2 : 3, text: h[2] });
      i++;
      continue;
    }

    if (/^\s*(-{3,}|\*{3,})\s*$/.test(line)) { out.push({ t: 'hr' }); i++; continue; }

    if (/^\s*\|/.test(line) && i + 1 < lines.length && TABLE_SEP_RE.test(lines[i + 1])) {
      const head = cells(line);
      const align = cells(lines[i + 1]).map(c => (c.startsWith(':') && c.endsWith(':') ? 'center' : c.endsWith(':') ? 'right' : 'left') as 'left' | 'right' | 'center');
      const rows: string[][] = [];
      i += 2;
      while (i < lines.length && /^\s*\|/.test(lines[i])) rows.push(cells(lines[i++]));
      out.push({ t: 'table', head, rows, align });
      continue;
    }

    if (/^\s*>/.test(line)) {
      const q: string[] = [];
      while (i < lines.length && /^\s*>/.test(lines[i])) q.push(lines[i++].replace(/^\s*>\s?/, ''));
      out.push({ t: 'quote', text: q.join(' ').trim() });
      continue;
    }

    if (LIST_RE.test(line)) {
      const [list, next] = parseList(lines, i);
      out.push({ t: 'list', list });
      i = next;
      continue;
    }

    const p: string[] = [];
    while (i < lines.length && lines[i].trim() && !(p.length && startsBlock(lines[i], lines[i + 1]))) p.push(lines[i++].trim());
    out.push({ t: 'p', text: p.join(' ') });
  }
  return out;
}

// ───────── Inline ─────────

export type Inline =
  | { t: 'text'; v: string }
  | { t: 'code'; v: string }
  | { t: 'strong'; c: Inline[] }
  | { t: 'em'; c: Inline[] }
  | { t: 'link'; href: string; c: Inline[] };

// Tanpa lookbehind (iOS lama tidak mendukung): miring memakai grup awalan (m[4]) yang ikut dicocokkan.
const INLINE_RE = /(`+)([^`]|[^`][\s\S]*?[^`])\1(?!`)|\*\*([^*][\s\S]*?)\*\*|(^|[^\w*])\*([^\s*][^*]*?)\*(?![\w*])|\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;

export function parseInline(src: string): Inline[] {
  const out: Inline[] = [];
  let last = 0;
  for (const m of src.matchAll(INLINE_RE)) {
    const at = m.index! + (m[5] !== undefined ? m[4].length : 0); // awalan miring tetap jadi teks biasa
    if (at > last) out.push({ t: 'text', v: src.slice(last, at) });
    if (m[1]) out.push({ t: 'code', v: m[2] });
    else if (m[3] !== undefined) out.push({ t: 'strong', c: parseInline(m[3]) });
    else if (m[5] !== undefined) out.push({ t: 'em', c: parseInline(m[5]) });
    else out.push({ t: 'link', href: m[7], c: parseInline(m[6]) });
    last = m.index! + m[0].length;
  }
  if (last < src.length) out.push({ t: 'text', v: src.slice(last) });
  return out;
}

/** Perkiraan menit baca: ~170 kata per menit, minimal 1. */
export const readingMinutes = (src: string) => Math.max(1, Math.round(src.split(/\s+/).filter(Boolean).length / 170));
