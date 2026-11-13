// Catatan materi per topik. Kuncinya adalah id topik di src/data/roadmap.ts.
// Menambah catatan: taruh file .md di folder ini, impor di bawah, daftarkan dengan id topiknya.
import python from './python.md?raw';
import gitGithub from './git-github.md?raw';
import sql from './sql.md?raw';

export const NOTES: Record<string, string> = {
  python,
  'git-github': gitGithub,
  sql,
};
