// Comprehensive email templates for all customer journeys

export interface EmailTemplate {
  subject: string;
  preview: string;
  html: string;
  plainText: string;
}

export const emailTemplates = {
  // Trial confirmation sequence
  trialConfirmation: (data: {
    name: string;
    trialDate: string;
    trialTime: string;
    classLink?: string;
    calendarUrl: string;
  }): EmailTemplate => ({
    subject: `Your free Korean trial class is confirmed! 🇰🇷`,
    preview: `${data.name}, your class with Klovers is on ${data.trialDate} at ${data.trialTime}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px; text-align: center; }
            .content { padding: 30px 0; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
            .divider { border-top: 1px solid #eee; margin: 20px 0; }
            .footer { color: #666; font-size: 12px; text-align: center; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Your trial class is confirmed! 🎉</h1>
            </div>
            <div class="content">
              <p>Hi ${data.name},</p>
              <p>Great news! Your free Korean trial class with Klovers is all set.</p>

              <div style="background: #f8f9fa; padding: 20px; border-radius: 6px; margin: 20px 0;">
                <p><strong>📅 Date:</strong> ${data.trialDate}</p>
                <p><strong>⏰ Time:</strong> ${data.trialTime} (Africa/Cairo)</p>
                <p><strong>⏱️ Duration:</strong> 30 minutes</p>
                ${data.classLink ? `<p><strong>🔗 Class Link:</strong> <a href="${data.classLink}">${data.classLink}</a></p>` : ''}
              </div>

              <p style="text-align: center;">
                <a href="${data.calendarUrl}" class="button">📱 Add to Calendar</a>
              </p>

              <div class="divider"></div>

              <h3>What to expect:</h3>
              <ul>
                <li>Live session with a real Korean teacher</li>
                <li>Assessment of your current level</li>
                <li>Personalized learning recommendations</li>
                <li>No credit card required</li>
              </ul>

              <h3>Tips for success:</h3>
              <ul>
                <li>Join 5 minutes early to test your audio/video</li>
                <li>Find a quiet place to minimize distractions</li>
                <li>Have a notebook handy to take notes</li>
                <li>Come with questions about your learning goals!</li>
              </ul>

              <div class="divider"></div>

              <p>Questions? Reply to this email or <a href="https://wa.me/201121777560">chat with us on WhatsApp</a>.</p>

              <p>See you soon! 🇰🇷</p>
              <p><strong>The Klovers Team</strong></p>
            </div>

            <div class="footer">
              <p>© 2026 Klovers Academy. All rights reserved.</p>
              <p><a href="https://kloversegy.com/unsubscribe?email=${encodeURIComponent(data.name)}">Unsubscribe</a></p>
            </div>
          </div>
        </body>
      </html>
    `,
    plainText: `
Your trial class is confirmed!

Hi ${data.name},

Great news! Your free Korean trial class with Klovers is all set.

📅 Date: ${data.trialDate}
⏰ Time: ${data.trialTime} (Africa/Cairo)
⏱️ Duration: 30 minutes
${data.classLink ? `🔗 Class Link: ${data.classLink}` : ''}

What to expect:
- Live session with a real Korean teacher
- Assessment of your current level
- Personalized learning recommendations
- No credit card required

Tips for success:
- Join 5 minutes early to test your audio/video
- Find a quiet place to minimize distractions
- Have a notebook handy to take notes
- Come with questions about your learning goals!

Questions? Reply to this email or chat with us on WhatsApp: https://wa.me/201121777560

See you soon! 🇰🇷
The Klovers Team
    `,
  }),

  // 1-day reminder
  trialReminder1Day: (data: { name: string; trialTime: string; classLink?: string }): EmailTemplate => ({
    subject: `Tomorrow! Your Korean trial class with Klovers ⏰`,
    preview: `${data.name}, your free class starts tomorrow at ${data.trialTime}`,
    html: `
      <!DOCTYPE html>
      <html>
        <body style="font-family: sans-serif; margin: 0; padding: 20px; background: #f9fafb;">
          <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px;">
            <h2 style="color: #667eea;">Your trial class is tomorrow! 🎓</h2>
            <p>Hi ${data.name},</p>
            <p>Just a friendly reminder that your free Korean trial class with Klovers is <strong>tomorrow at ${data.trialTime}</strong>.</p>

            ${data.classLink ? `
              <div style="background: #f0f4ff; padding: 15px; border-radius: 6px; margin: 20px 0;">
                <p><strong>📍 Join Here:</strong> <a href="${data.classLink}">${data.classLink}</a></p>
              </div>
            ` : ''}

            <h3>Quick checklist:</h3>
            <ul>
              <li>✅ Test your microphone and camera</li>
              <li>✅ Join 5 minutes early</li>
              <li>✅ Have your notebook ready</li>
              <li>✅ Find a quiet space</li>
            </ul>

            <p style="text-align: center; margin-top: 30px;">
              <a href="https://wa.me/201121777560" style="background: #25D366; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px;">💬 Message us on WhatsApp</a>
            </p>

            <p style="color: #666; font-size: 12px; text-align: center; margin-top: 30px;">
              © 2026 Klovers Academy
            </p>
          </div>
        </body>
      </html>
    `,
    plainText: `Your trial class is tomorrow! 🎓

Hi ${data.name},

Just a friendly reminder that your free Korean trial class with Klovers is tomorrow at ${data.trialTime}.

${data.classLink ? `📍 Join Here: ${data.classLink}` : ''}

Quick checklist:
- ✅ Test your microphone and camera
- ✅ Join 5 minutes early
- ✅ Have your notebook ready
- ✅ Find a quiet space

Questions? Message us on WhatsApp: https://wa.me/201121777560

See you tomorrow! 🇰🇷
Klovers Team
    `,
  }),

  // Post-trial follow-up (attended)
  postTrialFollowUp: (data: {
    name: string;
    level: string;
    nextSteps: string;
    offerId?: string;
  }): EmailTemplate => ({
    subject: `How was your Korean class? Special offer inside 🎁`,
    preview: `We'd love to hear your feedback, ${data.name}!`,
    html: `
      <!DOCTYPE html>
      <html>
        <body style="font-family: sans-serif; margin: 0; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px;">
            <h2>How was your trial class? 🇰🇷</h2>
            <p>Hi ${data.name},</p>
            <p>We hope you enjoyed your free Korean class! We'd love to hear your feedback.</p>

            <div style="background: #fff3cd; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #ffc107;">
              <h3 style="margin-top: 0;">💚 Limited-time offer:</h3>
              <p>As a trial student, you're eligible for <strong>20% off your first month</strong> of our courses.</p>
              <p>Your level: <strong>${data.level}</strong></p>
              <p style="text-align: center; margin-top: 20px;">
                <a href="https://kloversegy.com/enroll?offer=${data.offerId || 'trial20'}" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px;">Claim Your Offer</a>
              </p>
            </div>

            <h3>What's next?</h3>
            <p>${data.nextSteps}</p>

            <div style="margin: 30px 0; border-top: 1px solid #eee; padding-top: 20px;">
              <p style="color: #666; font-size: 14px;">Questions? We're here to help!</p>
              <p>
                <a href="https://wa.me/201121777560">💬 WhatsApp</a> |
                <a href="mailto:hello@kloversegy.com">📧 Email</a> |
                <a href="https://t.me/+Fu5T7d4wLMsxNDY9">📱 Telegram</a>
              </p>
            </div>

            <p style="color: #999; font-size: 12px; text-align: center;">
              © 2026 Klovers Academy | <a href="https://kloversegy.com/unsubscribe">Unsubscribe</a>
            </p>
          </div>
        </body>
      </html>
    `,
    plainText: `How was your trial class? 🇰🇷

Hi ${data.name},

We hope you enjoyed your free Korean class! We'd love to hear your feedback.

💚 Limited-time offer:
As a trial student, you're eligible for 20% off your first month of our courses.
Your level: ${data.level}

Claim your offer: https://kloversegy.com/enroll?offer=${data.offerId || 'trial20'}

What's next?
${data.nextSteps}

Questions? We're here to help!
- 💬 WhatsApp: https://wa.me/201121777560
- 📧 Email: hello@kloversegy.com
- 📱 Telegram: https://t.me/+Fu5T7d4wLMsxNDY9

© 2026 Klovers Academy
    `,
  }),

  // Win-back email for inactive users
  winBack: (data: { name: string; lastActivityDays: number }): EmailTemplate => ({
    subject: `We miss you, ${data.name}! Come back to Korean 🇰🇷`,
    preview: `We have new lessons and special offers waiting for you`,
    html: `
      <!DOCTYPE html>
      <html>
        <body style="font-family: sans-serif;">
          <div style="max-width: 600px; margin: 0 auto; padding: 30px;">
            <h2>We miss you! 💙</h2>
            <p>Hi ${data.name},</p>
            <p>It's been ${data.lastActivityDays} days since we last saw you in Klovers. We've added new lessons and features you might love!</p>

            <div style="background: #f0f4ff; padding: 20px; border-radius: 6px; margin: 20px 0;">
              <h3 style="margin-top: 0;">What's new:</h3>
              <ul>
                <li>🎬 K-drama inspired lessons</li>
                <li>🗣️ New conversation practice modules</li>
                <li>🏆 Gamified learning streaks</li>
                <li>👥 Community events and study groups</li>
              </ul>
            </div>

            <p style="text-align: center; margin: 30px 0;">
              <a href="https://kloversegy.com/dashboard" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px;">Jump Back In</a>
            </p>

            <p style="color: #666; font-size: 14px;">Not interested in learning Korean right now? <a href="https://kloversegy.com/unsubscribe">Unsubscribe</a></p>
          </div>
        </body>
      </html>
    `,
    plainText: `We miss you! 💙

Hi ${data.name},

It's been ${data.lastActivityDays} days since we last saw you in Klovers. We've added new lessons and features you might love!

What's new:
- 🎬 K-drama inspired lessons
- 🗣️ New conversation practice modules
- 🏆 Gamified learning streaks
- 👥 Community events and study groups

Jump back in: https://kloversegy.com/dashboard

Not interested right now? Unsubscribe: https://kloversegy.com/unsubscribe
    `,
  }),
};

// Helper to send templated email
export const sendTemplatedEmail = async (
  to: string,
  template: EmailTemplate,
  {
    from = "hello@kloversegy.com",
    unsubscribeToken,
  }: {
    from?: string;
    unsubscribeToken?: string;
  } = {}
) => {
  // This would integrate with your email service (Resend, SendGrid, etc.)
  // For now, returning the template structure
  return {
    to,
    from,
    subject: template.subject,
    html: template.html,
    text: template.plainText,
    headers: {
      "List-Unsubscribe": unsubscribeToken
        ? `<${unsubscribeToken}>`
        : "<https://kloversegy.com/unsubscribe>",
    },
  };
};
