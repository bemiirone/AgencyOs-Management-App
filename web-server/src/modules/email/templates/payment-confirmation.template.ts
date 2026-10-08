export interface PaymentConfirmationVariables {
  clientName: string;
  invoiceNumber: string;
  amount: number;
  paidAt: string;
}

export function buildPaymentConfirmationHTML(vars: PaymentConfirmationVariables): string {
  const formattedAmount = vars.amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
  const formattedPaidAt = new Date(vars.paidAt).toLocaleDateString('en-US', {
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
      <title>Payment Received</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f1f5f9; padding: 32px 0;">
        <tr>
          <td align="center">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 32px;">
                  <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #ffffff;">Payment Received</h1>
                  <p style="margin: 8px 0 0 0; font-size: 16px; color: rgba(255, 255, 255, 0.9);">Thank you!</p>
                </td>
              </tr>
              
              <!-- Body -->
              <tr>
                <td style="padding: 32px;">
                  <p style="font-size: 16px; color: #1e293b; margin: 0 0 24px 0;">Hi ${vars.clientName},</p>
                  
                  <p style="font-size: 16px; color: #334155; margin: 0 0 24px 0; line-height: 1.6;">
                    We've successfully received your payment. Thank you for your prompt payment!
                  </p>
                  
                  <!-- Details Box -->
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f0fdf4; border-radius: 8px; margin-bottom: 24px;">
                    <tr>
                      <td style="padding: 20px;">
                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td style="padding: 8px 0;">
                              <span style="font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em;">Invoice Number</span>
                              <p style="font-size: 16px; color: #1e293b; margin: 4px 0 0 0; font-weight: 600;">${vars.invoiceNumber}</p>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 0; border-top: 1px solid #bbf7d0;">
                              <span style="font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em;">Amount Paid</span>
                              <p style="font-size: 24px; color: #10b981; margin: 4px 0 0 0; font-weight: 700;">${formattedAmount}</p>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 0; border-top: 1px solid #bbf7d0;">
                              <span style="font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em;">Payment Date</span>
                              <p style="font-size: 16px; color: #1e293b; margin: 4px 0 0 0; font-weight: 600;">${formattedPaidAt}</p>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                  
                  <p style="font-size: 14px; color: #64748b; margin: 24px 0 0 0; line-height: 1.6;">
                    A receipt has been generated for your records. If you have any questions about this payment, please don't hesitate to reach out.
                  </p>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="padding: 24px 32px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center;">
                  <p style="font-size: 14px; color: #64748b; margin: 0;">Thank you for your business!</p>
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
