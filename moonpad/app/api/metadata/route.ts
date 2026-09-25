import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { name, symbol, description, image } = body;

    if (!name || !symbol || !description || !image) {
      return NextResponse.json(
        { error: 'Missing token metadata' },
        { status: 400 }
      );
    }

    const metadata = {
      name,
      symbol,
      description,
      image,
      showName: true,
      createdOn: 'https://moonpad.app',
    };

    return NextResponse.json({
      metadata,
      metadataUri: `data:application/json,${encodeURIComponent(JSON.stringify(metadata))}`,
    });
  } catch {
    return NextResponse.json(
      { error: 'Invalid metadata request' },
      { status: 400 }
    );
  }
}
