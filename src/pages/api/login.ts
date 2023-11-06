import { kv } from '@vercel/kv';
import type { APIContext } from 'astro';

export async function POST({ request }: APIContext) {
  // step 0: "harden" route execution
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${import.meta.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  // step 1: login to student.wwsi.edu.pl and retrieve cookie

  const url = 'https://student.wwsi.edu.pl/,login';

  const username = encodeURIComponent(import.meta.env.WWSI_LOGIN);
  const password = encodeURIComponent(import.meta.env.WWSI_PASSWORD);

  const formData = `login=${username}&password=${password}&login_send=send`;

  const headers = new Headers({
    Host: 'student.wwsi.edu.pl',
    'User-Agent': 'curl/8.1.2',
    Accept: '*/*',
    'Content-Type': 'application/x-www-form-urlencoded',
  });

  const loginRequest = new Request(url, {
    method: 'POST',
    body: formData,
    credentials: 'include', // This includes cookies in the request
    headers,
    redirect: 'manual',
    referrer: '', // tutaj moze 'https://student.wwsi.edu.pl/,login' ?
  });

  const response = await fetch(loginRequest);

  // NOTE: opis tego co się tu dzieje: Po wysłaniu requestu
  //       w responsie jest dwa razy nagłówek `Set-Cookie`.
  //       Pierwsza wartość to user niezalogowany, a druga
  //       to user z prawidłową sesją. Node/bun niestety
  //       podczas wyciągania cookie z responsa podaje
  //       tą pierwszą wartość... iterowanie przez headery
  //       i wrzucanie wartości 'set-cookie' do Mapy jest
  //       overengineered ..... ale na ten moment działa.

  const headersMap = new Map();

  for (let [key, value] of response.headers) {
    if (key === 'set-cookie') headersMap.set('dis_what_i_want', value);
    //console.log(key, "=", value);
  }

  const cookieHeader = headersMap.get('dis_what_i_want') as string;
  const cookies = cookieHeader ? cookieHeader.split(';') : [];

  const cookieData: Record<string, string> = {};

  cookies.forEach((cookie) => {
    const [name, value] = cookie.split('=');
    cookieData[name.trim()] = value.trim();
  });

  // console.log('proper cookie value', headersMap.get('dis_what_i_want'));

  // step 2: update value in redis

  try {
    await kv.set('cookie', cookieData.APPSESSID);
  } catch (err) {
    console.error('error while updating data in Vercel KV! ', err);
    return new Response(JSON.stringify(err), { status: 400 });
  }

  return new Response('');
}

export async function GET({ request }: APIContext) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${import.meta.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const appsessid = await kv.get('cookie');

  const headers = new Headers({
    'Content-Type': 'application/json',
  });

  return new Response(JSON.stringify({ appsessid }), { headers });
}
