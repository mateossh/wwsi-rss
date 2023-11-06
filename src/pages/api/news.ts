import { kv } from '@vercel/kv';

import { JSDOM } from 'jsdom';
import { DateTime } from 'luxon';

import { randomBytes } from 'crypto';

type FeedItem = {
  title?: string;
  description?: string;
  pubDate?: number | string;
  link: string;
};

export const runtime = 'edge';

export async function GET() {
  const appsessid = await kv.get('cookie');

  const cookie = `APPSESSID=${appsessid}`;
  const url = 'https://student.wwsi.edu.pl/info';

  const headers = new Headers({
    Cookie: cookie,
  });

  const request = new Request(url, {
    method: 'GET',
    headers,
  });

  const response = await fetch(request);

  if (!response.ok) {
    console.error('error while requesting data from WWSI');
  }

  const html = await response.text();

  const dom = new JSDOM(html);
  const document = dom.window.document;

  const news = document.querySelectorAll('.news_box');
  const items: FeedItem[] = [];

  news.forEach((item) => {
    const title = item.querySelector('.news_title')?.textContent || '';
    const description = item.querySelector('.news_content')?.textContent || '';

    const date = item.querySelector('.news_podpis')?.textContent;
    const dateStr = date!.split(' ')[1];
    const timeZone = 'Europe/Warsaw';

    const parsedDate = DateTime.fromFormat(dateStr, 'dd-MM-yyyy', {
      zone: timeZone,
    });
    const pubDate = parsedDate.toISODate()!;

    const link = `https://student.wwsi.edu.pl/non-existed-link/info#${randomBytes(
      12,
    ).toString('hex')}`;

    items.push({ title, pubDate, description, link });
  });

  const responseHeaders = new Headers({
    'Content-Type': 'application/json',
    'Cache-Control': 'public, s-maxage=1800',
  });

  return new Response(JSON.stringify(items), { headers: responseHeaders });
}
