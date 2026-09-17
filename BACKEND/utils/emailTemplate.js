/**
 * Generates an official Lagos State MIST branded HTML email for student invitations.
 * 
 * @param {Object} params
 * @param {string} params.name - Intern's full name
 * @param {string} params.email - Intern's email address
 * @param {string} params.unit - Assigned department/unit track
 * @param {string} params.inviteLink - Unique registration URL
 * @returns {string} Fully styled HTML email document
 */
const generateInviteEmailHtml = ({ name, unit, inviteLink }) => {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MIST Student IT Portal Invitation</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td, p, a { font-family: Arial, Helvetica, sans-serif !important; }
  </style>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #F0F4F8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #F0F4F8; padding: 40px 15px;">
    <tr>
      <td align="center">
        <!-- Main Card Wrapper -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; background-color: #FFFFFF; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08); border: 1px solid #E2E8F0;">
          
          <!-- Top Civic Header Bar -->
          <tr>
            <td style="background: linear-gradient(135deg, #1A365D 0%, #132742 100%); padding: 32px 24px; text-align: center; border-bottom: 4px solid #006633;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="center">
                    <img src="cid:mistLogo" alt="Lagos State Ministry of Innovation, Science and Technology" width="80" style="display: block; width: 80px; height: auto; margin: 0 auto 14px; border: 0; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));" />
                    <h1 style="color: #FFFFFF; font-size: 20px; font-weight: 700; margin: 0 0 6px 0; letter-spacing: -0.01em;">Student IT Portal</h1>
                    <p style="color: #E2E8F0; font-size: 12px; font-weight: 500; margin: 0; text-transform: uppercase; letter-spacing: 1px;">Lagos State Ministry of Innovation, Science and Technology</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Body Section with MIST Watermark Background -->
          <tr>
            <td style="padding: 40px 36px; background-color: #FFFFFF; background-image: url('cid:mistLogo'); background-repeat: no-repeat; background-position: center center; background-size: 260px auto; position: relative;">
              <!-- Overlay to guarantee maximum text readability -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: rgba(255, 255, 255, 0.94); border-radius: 8px; padding: 12px;">
                <tr>
                  <td>
                    <p style="color: #1A365D; font-size: 16px; font-weight: 700; margin: 0 0 16px 0;">
                      Dear ${name},
                    </p>

                    <p style="color: #4A5568; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0;">
                      You have been officially invited to join the <strong>Lagos State Ministry of Innovation, Science and Technology (MIST) Student IT Portal</strong> as an active intern for your designated service unit.
                    </p>

                    <!-- Assigned Unit Highlight Box -->
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #F7FAFC; border-left: 4px solid #006633; border-radius: 4px; padding: 14px 18px; margin: 0 0 24px 0; border-top: 1px solid #E2E8F0; border-right: 1px solid #E2E8F0; border-bottom: 1px solid #E2E8F0;">
                      <tr>
                        <td>
                          <span style="display: block; font-size: 11px; font-weight: 700; text-transform: uppercase; color: #718096; letter-spacing: 0.5px;">Assigned Department / Unit</span>
                          <strong style="display: block; font-size: 16px; color: #1A365D; margin-top: 4px;">${unit}</strong>
                        </td>
                      </tr>
                    </table>

                    <p style="color: #4A5568; font-size: 14px; line-height: 1.6; margin: 0 0 28px 0;">
                      Through this portal, you will access your curriculum modules, submit weekly coursework assignments, track your practical evaluation, and interact with your unit supervisors.
                    </p>

                    <!-- Primary Action CTA Button -->
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 0 0 28px 0;">
                      <tr>
                        <td align="center">
                          <a href="${inviteLink}" target="_blank" style="display: inline-block; background-color: #1A365D; color: #FFFFFF; text-decoration: none; font-size: 14px; font-weight: 700; padding: 14px 32px; border-radius: 6px; box-shadow: 0 3px 8px rgba(26, 54, 93, 0.3); letter-spacing: 0.02em;">
                            Activate Account & Create Password &rarr;
                          </a>
                        </td>
                      </tr>
                    </table>

                    <!-- Expiration Notice -->
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #FFFDF5; border: 1px solid #FEEBC8; border-radius: 6px; padding: 12px 16px; margin: 0 0 24px 0;">
                      <tr>
                        <td>
                          <p style="margin: 0; font-size: 12px; color: #975A16; line-height: 1.5;">
                            <strong>Notice:</strong> This registration link is unique to you and will expire in <strong>48 hours</strong>. Once activated, your login email will be the address this notification was sent to.
                          </p>
                        </td>
                      </tr>
                    </table>

                    <!-- Fallback Link Section -->
                    <p style="color: #718096; font-size: 12px; line-height: 1.5; margin: 0 0 8px 0;">
                      If the button above does not open, copy and paste the following link directly into your web browser:
                    </p>
                    <p style="margin: 0 0 16px 0; word-break: break-all;">
                      <a href="${inviteLink}" style="color: #1A365D; font-size: 12px; text-decoration: underline;">
                        ${inviteLink}
                      </a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Official Government Footer -->
          <tr>
            <td style="background-color: #F7FAFC; padding: 24px 36px; border-top: 1px solid #E2E8F0; text-align: center;">
              <p style="margin: 0 0 4px 0; font-size: 12px; font-weight: 700; color: #1A365D;">
                Lagos State Ministry of Innovation, Science and Technology
              </p>
              <p style="margin: 0 0 12px 0; font-size: 11px; color: #718096;">
                Block 18, The Secretariat, Alausa, Ikeja, Lagos State, Nigeria
              </p>
              <p style="margin: 0; font-size: 10px; color: #A0AEC0;">
                This is an automated administrative notification. Please do not reply directly to this email address.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};

module.exports = {
  generateInviteEmailHtml
};
