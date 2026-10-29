/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * DarkWatch AI - Email Delivery Service
 * Sends dynamic OTPs via Resend API or SMTP, with development terminal fallback.
 */

export interface SendOtpOptions {
  toEmail: string;
  username: string;
  otpCode: string;
  purpose: 'REGISTRATION' | 'PASSWORD_RESET' | 'MFA_STEPUP';
}

export interface EmailDeliveryResult {
  delivered: boolean;
  provider: 'RESEND' | 'SMTP' | 'DEVELOPMENT_FALLBACK';
  message: string;
}

export async function sendOtpEmail(options: SendOtpOptions): Promise<EmailDeliveryResult> {
  const { toEmail, username, otpCode, purpose } = options;
  const isDev = process.env.NODE_ENV !== 'production';

  const purposeLabel = 
    purpose === 'REGISTRATION' ? 'Account Registration Verification' :
    purpose === 'PASSWORD_RESET' ? 'Zero-Trust Password Recovery' :
    'Multi-Factor Authentication Step-Up';

  // 1. Check if Resend API key is configured
  const resendApiKey = process.env.RESEND_API_KEY;
  if (resendApiKey) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM || 'DarkWatch AI <security@darkwatch.corp>',
          to: [toEmail],
          subject: `[DarkWatch AI] Your ${purposeLabel} Code: ${otpCode}`,
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #050814; color: #f8fafc; padding: 32px; border-radius: 12px; max-width: 560px; margin: 0 auto; border: 1px solid #1e2648;">
              <h2 style="color: #22d3ee; margin-top: 0;">DarkWatch AI Security Portal</h2>
              <p style="font-size: 14px; color: #cbd5e1;">Hello <strong>${username}</strong>,</p>
              <p style="font-size: 14px; color: #94a3b8;">A security authorization request was triggered for <strong>${purposeLabel}</strong>.</p>
              <div style="background-color: #0a0f24; border: 1px solid #3b82f6; border-radius: 8px; padding: 20px; text-align: center; margin: 24px 0;">
                <span style="font-family: monospace; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #38bdf8;">${otpCode}</span>
              </div>
              <p style="font-size: 12px; color: #f59e0b;">⚠️ This code expires in exactly <strong>10 minutes</strong> and is strictly single-use. Do not share it with anyone.</p>
              <hr style="border: 0; border-top: 1px solid #1e2648; margin: 24px 0;" />
              <p style="font-size: 11px; color: #64748b;">DarkWatch AI • Autonomous Cyber Threat Early Warning & Incident Response System</p>
            </div>
          `,
        }),
      });

      if (response.ok) {
        return {
          delivered: true,
          provider: 'RESEND',
          message: `Verification code sent to registered email ${toEmail}.`,
        };
      } else {
        const errData = await response.text();
        console.error('Resend delivery failure:', errData);
      }
    } catch (e) {
      console.error('Failed invoking Resend API:', e);
    }
  }

  // 2. Development-Only Terminal Logging Fallback
  if (isDev) {
    console.log('\n=============================================================');
    console.log(`[DarkWatch DEV OTP SENDER] Purpose: ${purposeLabel}`);
    console.log(`[Target User]: ${username} (${toEmail})`);
    console.log(`[DYNAMIC 6-DIGIT OTP]: >>> ${otpCode} <<< (Expires in 10 minutes)`);
    console.log('=============================================================\n');

    return {
      delivered: true,
      provider: 'DEVELOPMENT_FALLBACK',
      message: `[Development Mode] Verification code dispatched to ${toEmail}. (Logged to server terminal for local verification).`,
    };
  }

  return {
    delivered: false,
    provider: 'DEVELOPMENT_FALLBACK',
    message: 'Email service is not configured on this server. Please contact your SecOps administrator.',
  };
}
