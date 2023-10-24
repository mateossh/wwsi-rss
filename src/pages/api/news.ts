import { JSDOM } from 'jsdom';
import { DateTime } from 'luxon';

type FeedItem = {
  title?: string,
  description?: string,
  pubDate?: number | string,
  link: '',
}

export async function GET() {
  const cookie = 'APPSESSID=tucookiezprzegladarki';
  const url = 'https://student.wwsi.edu.pl/info';

  const headers = new Headers({
    'Cookie': cookie,
  })

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

  news.forEach(item => {
    const title = item.querySelector('.news_title')?.textContent || '';
    const description = item.querySelector('.news_content')?.textContent || '';

    const date = item.querySelector('.news_podpis')?.textContent;
    const dateStr = date!.split(' ')[1];
    const timeZone = 'Europe/Warsaw';

    const parsedDate = DateTime.fromFormat(dateStr, 'dd-MM-yyyy', { zone: timeZone });
    const pubDate = parsedDate.toISODate()!;

    items.push({ title, pubDate, description, link: '' });
  });

  const responseHeaders = new Headers({
    'Content-Type': 'application/json'
  })
  
  return new Response(JSON.stringify(items), { headers: responseHeaders });
}
