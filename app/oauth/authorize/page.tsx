import { redirect } from 'next/navigation';
import { getSession } from '@/lib/utils/session';
import { getOAuthClientByClientId } from '@/lib/db/queries';
import { OAUTH_SCOPE } from '@/lib/utils/oauth';

export const metadata = { title: 'Authorize application' };
export const dynamic = 'force-dynamic';

interface AuthorizeParams {
  response_type?: string;
  client_id?: string;
  redirect_uri?: string;
  state?: string;
  code_challenge?: string;
  code_challenge_method?: string;
  scope?: string;
}

function ErrorCard({ message }: { message: string }) {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow p-8 text-center">
        <h1 className="text-xl font-semibold text-gray-900 mb-2">
          Authorization error
        </h1>
        <p className="text-gray-600">{message}</p>
      </div>
    </main>
  );
}

/**
 * OAuth 2.1 authorization endpoint (consent page).
 * Rides on the normal session cookie: unauthenticated users are sent through
 * the existing login flow (including Google) and return here via ?returnTo=.
 * Invalid client/redirect combinations render an error and never redirect,
 * per RFC 6749 §4.1.2.1.
 */
export default async function AuthorizePage({
  searchParams,
}: {
  searchParams: Promise<AuthorizeParams>;
}) {
  const params = await searchParams;
  const {
    response_type,
    client_id,
    redirect_uri,
    state,
    code_challenge,
    code_challenge_method,
  } = params;

  if (!client_id || !redirect_uri) {
    return <ErrorCard message="Missing client_id or redirect_uri." />;
  }

  const client = await getOAuthClientByClientId(client_id);
  if (!client) {
    return <ErrorCard message="Unknown application (client_id not registered)." />;
  }
  if (!client.redirect_uris.includes(redirect_uri)) {
    return <ErrorCard message="The redirect URI is not registered for this application." />;
  }

  // Client and redirect URI are trusted from here on, so protocol errors may
  // be returned via redirect per spec.
  const errorRedirect = (error: string) => {
    const url = new URL(redirect_uri);
    url.searchParams.set('error', error);
    if (state) url.searchParams.set('state', state);
    redirect(url.toString());
  };

  if (response_type !== 'code') {
    errorRedirect('unsupported_response_type');
  }
  if (!code_challenge || code_challenge_method !== 'S256') {
    errorRedirect('invalid_request');
  }

  const session = await getSession();
  if (!session || !session.userId) {
    const query = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined) as [string, string][]
    );
    redirect(`/login?returnTo=${encodeURIComponent(`/oauth/authorize?${query}`)}`);
  }

  const clientName = client.client_name || 'An application';
  const denyUrl = new URL(redirect_uri);
  denyUrl.searchParams.set('error', 'access_denied');
  if (state) denyUrl.searchParams.set('state', state);

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow p-8">
        <h1 className="text-xl font-semibold text-gray-900 mb-1">
          {clientName} wants access to your bookshelf
        </h1>
        <p className="text-sm text-gray-500 mb-6">
          Signed in as {session!.email || session!.username || 'your account'}
        </p>

        <ul className="mb-8 space-y-2 text-sm text-gray-700">
          <li className="flex items-start gap-2">
            <span aria-hidden>✓</span>
            View your shelves and the items on them
          </li>
          <li className="flex items-start gap-2">
            <span aria-hidden>✓</span>
            Create shelves and add, edit, or remove items
          </li>
        </ul>

        <form method="POST" action="/api/oauth/authorize" className="space-y-3">
          <input type="hidden" name="client_id" value={client_id} />
          <input type="hidden" name="redirect_uri" value={redirect_uri} />
          <input type="hidden" name="code_challenge" value={code_challenge} />
          {state && <input type="hidden" name="state" value={state} />}
          <input type="hidden" name="scope" value={OAUTH_SCOPE} />
          <button
            type="submit"
            className="w-full rounded-lg bg-gray-900 text-white py-2.5 font-medium hover:bg-gray-700 transition-colors"
          >
            Allow access
          </button>
          <a
            href={denyUrl.toString()}
            className="block text-center w-full rounded-lg border border-gray-300 py-2.5 font-medium text-gray-700 hover:bg-gray-100 transition-colors"
          >
            Deny
          </a>
        </form>
      </div>
    </main>
  );
}
