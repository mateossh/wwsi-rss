import rss from '@astrojs/rss';
import type { APIContext } from 'astro';


export async function GET({ request }: APIContext) {
  const { origin } = new URL(request.url);

  const items = await (await fetch(`${origin}/api/news`)).json();

  return rss({
    title: 'Komunikaty WWSI (ale lepsze)',
    description: 'Komunikaty - Studencki Panel Informacyjny',
    site: 'https://student.wwsi.edu.pl/info',
    items,
  });
}
