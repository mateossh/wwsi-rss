import { getRssString } from '@astrojs/rss';
import type { APIContext } from 'astro';

export async function GET({ request }: APIContext) {
  const { origin } = new URL(request.url);

  const items = await (await fetch(`${origin}/api/news`)).json();

  const rssString = await getRssString({
    title: 'Komunikaty WWSI (ale lepsze)',
    description: 'Komunikaty - Studencki Panel Informacyjny',
    site: 'https://student.wwsi.edu.pl/info',
    items,
  });

  if (items.length === 0) {
    return new Response('', { status: 500 });
  }

  return new Response(rssString, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, s-maxage=600',
    },
  });
}
