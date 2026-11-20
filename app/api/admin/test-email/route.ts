import { NextResponse } from 'next/server';
import { getAdminUser } from '@/lib/utils/admin';
import { sendEmail } from '@/lib/email/send';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('AdminTestEmail');

/**
 * Send a test email to the signed-in admin, to check Resend on a deploy
 * (issue #264). Admins only, and only to their own address. Waits for the
 * send so the response says what happened.
 */
export async function POST() {
  try {
    const admin = await getAdminUser();
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    }

    const result = await sendEmail({
      to: admin.email,
      subject: 'Virtual Bookshelf: test email',
      text:
        'This is a test email from Virtual Bookshelf, sent from the admin test route ' +
        'to check that email works on this deploy. No action needed.',
    });

    return NextResponse.json({ success: result.sent, data: result });
  } catch (error) {
    logger.errorWithException('Test email failed', error);
    return NextResponse.json({ success: false, error: 'Test email failed' }, { status: 500 });
  }
}
