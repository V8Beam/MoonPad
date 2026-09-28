import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      name,
      symbol,
      description,
      image,
    } = body;

    if (
      !name ||
      !symbol ||
      !description ||
      !image
    ) {
      return NextResponse.json(
        {
          error:
            'Missing token metadata',
        },
        {
          status: 400,
        }
      );
    }

    const imageResponse =
      await fetch(image);

    if (!imageResponse.ok) {
      return NextResponse.json(
        {
          error:
            'Unable to download token image.',
        },
        {
          status: 400,
        }
      );
    }

    const imageBlob =
      await imageResponse.blob();

    const formData =
      new FormData();

    formData.append(
      'file',
      imageBlob,
      'token-image'
    );

    formData.append(
      'name',
      String(name)
    );

    formData.append(
      'symbol',
      String(symbol)
    );

    formData.append(
      'description',
      String(description)
    );

    formData.append(
      'showName',
      'true'
    );

    const response =
      await fetch(
        'https://pump.fun/api/ipfs',
        {
          method: 'POST',
          body: formData,
        }
      );

    const result =
      await response.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          error:
            result?.error ||
            'Pump metadata upload failed.',
        },
        {
          status: 502,
        }
      );
    }

    const metadataUri =
      result?.metadataUri;

    if (
      !metadataUri ||
      typeof metadataUri !==
        'string'
    ) {
      return NextResponse.json(
        {
          error:
            'Pump did not return a metadata URI.',
        },
        {
          status: 502,
        }
      );
    }

    if (
      metadataUri.length > 200
    ) {
      return NextResponse.json(
        {
          error:
            `Pump returned a metadata URI that is too long (${metadataUri.length} characters).`,
        },
        {
          status: 502,
        }
      );
    }

    return NextResponse.json({
      metadataUri,
    });
  } catch (error) {
    console.error(
      'MoonPad metadata error:',
      error
    );

    return NextResponse.json(
      {
        error:
          'Metadata upload failed.',
      },
      {
        status: 500,
      }
    );
  }
}
