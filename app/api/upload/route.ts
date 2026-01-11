import { put } from '@vercel/blob';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get('filename');

    if (filename && request.body) {
        // Handle direct upload (optional, for client-side uploads)
        // or handle multipart form data as before
    }

    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json(
                { error: 'No file uploaded' },
                { status: 400 }
            );
        }

        const blob = await put(file.name, file, {
            access: 'public',
        });

        return NextResponse.json(blob);
    } catch (error) {
        console.error('Error uploading file:', error);
        return NextResponse.json(
            { error: 'Failed to upload file' },
            { status: 500 }
        );
    }
}
