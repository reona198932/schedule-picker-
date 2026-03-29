import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const accessToken = req.headers.get('X-Google-Access-Token');
  const timeMin = req.nextUrl.searchParams.get('timeMin');
  const timeMax = req.nextUrl.searchParams.get('timeMax');

  if (!accessToken) {
    return NextResponse.json({ error: 'No access token' }, { status: 401 });
  }

  if (!timeMin || !timeMax) {
    return NextResponse.json({ error: 'timeMin and timeMax required' }, { status: 400 });
  }

  try {
    const calendarUrl = new URL('https://www.googleapis.com/calendar/v3/calendars/primary/events');
    calendarUrl.searchParams.set('timeMin', timeMin);
    calendarUrl.searchParams.set('timeMax', timeMax);
    calendarUrl.searchParams.set('singleEvents', 'true');
    calendarUrl.searchParams.set('orderBy', 'startTime');
    calendarUrl.searchParams.set('maxResults', '250');

    const response = await fetch(calendarUrl.toString(), {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Calendar API error:', error);
      return NextResponse.json({ error: 'Calendar API error' }, { status: response.status });
    }

    const data = await response.json();

    // イベント情報を整形して返す
    const events = (data.items || []).filter((event: any) => !!event.start?.dateTime).map((event: any) => ({
      id: event.id,
      summary: event.summary || '(予定あり)',
      start: event.start?.dateTime || event.start?.date,
      end: event.end?.dateTime || event.end?.date,
      allDay: !!event.start?.date,
    }));

    return NextResponse.json({ events });
  } catch (error: any) {
    console.error('Calendar fetch error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
