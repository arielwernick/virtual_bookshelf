import { NextResponse } from 'next/server';

export async function GET() {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  // Check if credentials exist (don't expose the actual values)
  const hasClientId = !!clientId;
  const hasClientSecret = !!clientSecret;
  const clientIdLength = clientId?.length || 0;
  const clientSecretLength = clientSecret?.length || 0;

  return NextResponse.json({
    hasClientId,
    hasClientSecret,
    clientIdLength,
    clientSecretLength,
    clientIdPreview: clientId ? `${clientId.substring(0, 4)}...` : 'missing',
  });
}
