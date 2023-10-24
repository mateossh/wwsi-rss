import rss from '@astrojs/rss';

export async function GET() {
  // TODO: ten URL trzeba generować
  const items = await (await fetch('http://localhost:4321/api/news')).json();

  return rss({
    title: 'Komunikaty WWSI (ale lepsze)',
    description: 'Komunikaty - Studencki Panel Informacyjny',
    site: 'https://student.wwsi.edu.pl/info',
    items,
  });
}
