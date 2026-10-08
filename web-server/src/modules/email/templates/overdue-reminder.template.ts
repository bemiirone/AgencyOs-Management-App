export interface OverdueReminderVariables {
  clientName: string;
  invoiceNumber: string;
  amount: number;
  dueDate: string;
  daysOverdue: number;
  payLink: string;
}

export function buildOverdueReminderHTML(vars: OverdueReminderVariables): string {
  const formattedAmount = vars.amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
  const formattedDueDate = new Date(vars.dueDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Overdue Invoice Reminder</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f1f5f9; padding: 32px 0;">
        <tr>
          <td align="center">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 32px;">
                  <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #ffffff;">Overdue Invoice</h1>
                  <p style="margin: 8px 0 0 0; font-size: 16px; color: rgba(255, 255, 255, 0.9);">${vars.invoiceNumber}</p>
                </td>
              </tr>
              
              <!-- Body -->
              <tr>
                <td style="padding: 32px;">
                  <p style="font-size: 16px; color: #1e293b; margin: 0 0 24px 0;">Hi ${vars.clientName},</p>
                  
                  <p style="font-size: 16px; color: #334155; margin: 0 0 24px 0; line-height: 1.6;">
                    This is a friendly reminder that your invoice <strong style="color: #ef4444;">${vars.invoiceNumber}</strong> was due on <strong>${formattedDueDate}</strong> (${vars.daysOverdue} day${vars.daysOverdue !== 1 ? 's' : ''} ago).
                  </p>
                  
                  <!-- Warning Box -->
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #fef2f2; border-left: 4px solid #ef4444; border-radius: 4px; margin-bottom: 24px;">
                    <tr>
                      <td style="padding: 20px;">
                        <p style="font-size: 14px; color: #991b1b; margin: 0; line-height: 1.6;">
                          <strong>Outstanding Amount:</strong> ${formattedAmount}
                        </p>
                      </td>
                    </tr>
                  </table>
                  
                  <!-- CTA Button -->
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 32px 0;">
                    <tr>
                      <td align="center">
                        <a href="${vars.payLink}" style="display: inline-block; padding: 14px 32px; background-color: #ef4444; color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 600;">Pay Now</a>
                      </td>
                    </tr>
                  </table>
                  
                  <p style="font-size: 14px; color: #64748b; margin: 24px 0 0 0; line-height: 1.6;">
                    If you've already made this payment, please disregard this notice. If you have any questions or concerns, please don't hesitate to contact us.
                  </p>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="padding: 24px 32px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center;">
                  <p style="font-size: 14px; color: #64748b; margin: 0;">Thank you for your prompt attention to this matter.</p>
                  <p style="font-size: 12px; color: #94a3b8; margin: 8px 0 0 0;">Powered by AgencyOS</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}
