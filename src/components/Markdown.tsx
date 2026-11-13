import { Fragment, useMemo, type ReactNode } from 'react';
import { parseInline, parseMarkdown, type Block, type Inline, type ListNode } from '../lib/markdown';

function renderInline(nodes: Inline[]): ReactNode {
  return nodes.map((n, i) => {
    switch (n.t) {
      case 'text': return <Fragment key={i}>{n.v}</Fragment>;
      case 'code': return <code key={i}>{n.v}</code>;
      case 'strong': return <strong key={i}>{renderInline(n.c)}</strong>;
      case 'em': return <em key={i}>{renderInline(n.c)}</em>;
      case 'link': return <a key={i} href={n.href} target="_blank" rel="noopener noreferrer">{renderInline(n.c)}</a>;
    }
  });
}

const inline = (s: string) => renderInline(parseInline(s));

function List({ list }: { list: ListNode }) {
  const Tag = list.ordered ? 'ol' : 'ul';
  return (
    <Tag>
      {list.items.map((it, i) => (
        <li key={i}>
          {inline(it.text)}
          {it.sub && <List list={it.sub} />}
        </li>
      ))}
    </Tag>
  );
}

function BlockView({ b }: { b: Block }) {
  switch (b.t) {
    case 'h': return b.level === 2 ? <h3>{inline(b.text)}</h3> : <h4>{inline(b.text)}</h4>;
    case 'p': return <p>{inline(b.text)}</p>;
    case 'hr': return <hr />;
    case 'quote': return <blockquote>{inline(b.text)}</blockquote>;
    case 'list': return <List list={b.list} />;
    case 'code':
      return (
        <div className={b.lang ? 'code has-lang' : 'code'}>
          {b.lang && <span className="code-lang" aria-hidden="true">{b.lang}</span>}
          {/* tabIndex: blok kode yang bisa digulir harus bisa dijangkau keyboard */}
          <pre tabIndex={0}><code>{b.code}</code></pre>
        </div>
      );
    case 'table':
      return (
        <div className="table-wrap" tabIndex={0}>
          <table>
            <thead><tr>{b.head.map((h, i) => <th key={i} style={{ textAlign: b.align[i] }}>{inline(h)}</th>)}</tr></thead>
            <tbody>
              {b.rows.map((r, i) => (
                <tr key={i}>{b.head.map((_, j) => <td key={j} style={{ textAlign: b.align[j] }}>{inline(r[j] ?? '')}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
      );
  }
}

export function Markdown({ source }: { source: string }) {
  const blocks = useMemo(() => parseMarkdown(source), [source]);
  // data-vaul-no-drag: menggeser/menyeleksi isi materi tidak boleh ikut menyeret atau menutup panel.
  return <div className="md" data-vaul-no-drag>{blocks.map((b, i) => <BlockView key={i} b={b} />)}</div>;
}
