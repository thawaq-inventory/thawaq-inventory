import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const url = searchParams.get('url');

        if (!url) {
            return NextResponse.json({ error: 'URL is required' }, { status: 400 });
        }

        // Validate that it's a Google Maps URL
        if (!url.includes('google.com/maps') && !url.includes('goo.gl') && !url.includes('g.page') && !url.includes('maps.app.goo.gl')) {
            return NextResponse.json({ error: 'Invalid Google Maps URL' }, { status: 400 });
        }

        // Fetch the URL to get the redirected location
        // redirect: 'manual' tells fetch not to follow, but return the 3xx response
        // However, standard fetch in Node follows redirects by default seamlessly.
        // We actually WANT it to follow redirects so we get the final URL.
        const response = await fetch(url, {
            method: 'HEAD', // HEAD might suffice if servers return location header, but typically GET is safer for final URL
            redirect: 'follow',
        });

        // The final URL after following redirects
        const expandedUrl = response.url;

        return NextResponse.json({ expandedUrl });
    } catch (error) {
        console.error('Error expanding URL:', error);
        return NextResponse.json({ error: 'Failed to expand URL' }, { status: 500 });
    }
}
