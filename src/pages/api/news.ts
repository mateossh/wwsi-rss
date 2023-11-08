import { kv } from '@vercel/kv';
import { JSDOM } from 'jsdom';
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
  const rssUrl = 'https://student.wwsi.edu.pl/rss.xml';

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

  const schoolrssResponse = await fetch(rssUrl);
  if (!schoolrssResponse.ok) {
    console.error("error while requesting data from WWSI's RSS");
  }

  const rssText = await schoolrssResponse.text();

  const schoolrssDom = new JSDOM(rssText);
  const schoolrssDoc = schoolrssDom.window.document;

  const html = await response.text();

  const dom = new JSDOM(html);
  const document = dom.window.document;

  const news = document.querySelectorAll('.news_box');
  const items: FeedItem[] = [];

  news.forEach((item, index) => {
    const title = item.querySelector('.news_title')?.textContent || '';
    const description = item.querySelector('.news_content')?.textContent || '';

    const dataFromRss = schoolrssDoc.querySelector(
      `item:nth-of-type(${index + 1})`,
    );

    const pubDate = dataFromRss?.querySelector('pubDate')?.textContent!; // heh

    // NOTE: jsdom gives this weird output and the only way to retrieve link
    //       is "black magic"
    // const link = dataFromRss?.querySelector('link')?.innerHTML!;

    const link = dataFromRss?.innerHTML.split('<link>')[1].split('</item>')[0]!;

    items.push({ title, pubDate, description, link });
  });

  const responseHeaders = new Headers({
    'Content-Type': 'application/json',
    'Cache-Control': 'public, s-maxage=1800',
  });

  return new Response(JSON.stringify(items), { headers: responseHeaders });
}
