import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

// Configure the transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER, // Your email address
    pass: process.env.EMAIL_PASSWORD, // Your email password or app-specific password
  },
});

// Verify the transporter connection
transporter.verify((error, success) => {
  if (error) {
    console.error("Error verifying transporter:", error);
  } else {
    console.log("Nodemailer is ready to send emails");
  }
});

const generateEmailHtml = (message:string, subject:string) => `
<!DOCTYPE html>
<html>
  <head>
    <style>
      body {
        font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
        margin: 0;
        padding: 0;
        background-color: #f9fafb; /* Light background */
        color: #333; /* Default text color */
        line-height: 1.6;
      }

      .email-container {
        max-width: 600px;
        margin: 40px auto;
        padding: 30px;
        background-color: #ffffff;
        border-radius: 10px;
        box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
        border: 1px solid #e4e4e4;
      }

      .email-header {
        font-size: 24px;
        font-weight: bold;
        color: #2d3748;
        text-align: center;
        margin-bottom: 20px;
      }

      .email-body {
        font-size: 16px;
        color: #4a5568;
        margin-bottom: 20px;
        text-align: left;
      }

      .email-body p {
        margin: 10px 0;
      }

      .cta-button {
        display: block;
        width: fit-content;
        margin: 20px auto;
        padding: 12px 30px;
        font-size: 16px;
        font-weight: bold;
        color: #ffffff;
        background-color: #007bff;
        text-decoration: none;
        text-align: center;
        border-radius: 6px;
        transition: background-color 0.3s, transform 0.2s;
      }

      .cta-button:hover {
        background-color: #0056b3;
        transform: translateY(-2px);
      }

      .footer {
        font-size: 14px;
        color: #a0aec0;
        text-align: center;
        margin-top: 30px;
        border-top: 1px solid #e4e4e4;
        padding-top: 20px;
      }

      .footer a {
        color: #007bff;
        text-decoration: none;
      }

      .footer a:hover {
        text-decoration: underline;
      }

      /* Dark Mode Styles */
      @media (prefers-color-scheme: dark) {
        body {
          background-color: #181818;
          color: #e5e5e5;
        }

        .email-container {
          background-color: #1f1f1f;
          color: #e5e5e5;
          border: 1px solid #333;
        }

        .email-header {
          color: #ffffff;
        }

        .email-body {
          color: #cccccc;
        }

        .cta-button {
          background-color: #4caf50;
          color: #ffffff;
        }

        .cta-button:hover {
          background-color: #388e3c;
        }

        .footer {
          color: #888;
        }

        .footer a {
          color: #4caf50;
        }
      }
    </style>
  </head>
  <body>
    <div class="email-container">
      <!-- Email Header -->
      <div class="email-header">${subject}</div>

      <!-- Email Body -->
      <div class="email-body">
        <p>${message}</p>
      </div>

      <!-- Call to Action Button -->
      <a href="https://www.apneyy.com" class="cta-button">Visit Our Website</a>

      <!-- Footer -->
      <div class="footer">
        <p>
          This is an automated message. Please do not reply to this email. For assistance, contact
          <a href="mailto:support@apneyy.com">support@apneyy.com</a>.
        </p>
        <p>&copy; ${new Date().getFullYear()} Apneyy. All rights reserved.</p>
      </div>
    </div>
  </body>
</html>
`;



// Email sending function
export const sendEmail = async (to: string, subject: string, text: string) => {
  try {
    const html = generateEmailHtml(text, subject); // Generate the HTML content using the text
    const info = await transporter.sendMail({
      from: "Apneyy", // Sender address
      to, // Receiver email address
      subject, // Subject of the email
      html, // Email content in HTML format
    });

    console.log("Email sent:", info.messageId);
    return info;
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error("Email sending failed");
  }
};
