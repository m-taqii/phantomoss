import emailValidator from 'deep-email-validator';

/**
  Pings the email's SMTP server to verify if the inbox exists without sending an email.
  This checks MX records and performs an SMTP handshake (HELO, MAIL FROM, RCPT TO).
 */
export async function pingVerifyEmail(email: string): Promise<boolean> {
  if (!email || !email.includes("@")) return false;
  
  try {
    const res = await emailValidator({
      email,
      validateRegex: true,
      validateMx: true,
      validateTypo: false,
      validateDisposable: true,
      validateSMTP: true,
    });

    // If SMTP is valid, we know the inbox exists
    if (res.valid) {
      return true;
    }

    // Sometimes mail servers block pinging or have catch-alls that confuse the validator
    // We only return true if the SMTP validation explicitly succeeded
    return res.validators.smtp?.valid ?? false;
  } catch (error) {
    console.warn(`[PingVerifier] Failed to verify ${email}:`, error);
    return false;
  }
}
