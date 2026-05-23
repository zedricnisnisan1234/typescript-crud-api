// src/_helpers/send-email.ts
export async function sendEmail({
  to,
  subject,
  html
}: {
  to: string;
  subject: string;
  html: string;
}): Promise<void> {
  // Log email instead of sending (for testing purposes)
  console.log('📧 ========== EMAIL ==========');
  console.log('To:', to);
  console.log('Subject:', subject);
  console.log('Body:', html);
  console.log('📧 ============================');
}