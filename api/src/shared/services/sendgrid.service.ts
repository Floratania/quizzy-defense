import * as sgMail from '@sendgrid/mail';
import { MailDataRequired, MailJSON } from '@sendgrid/helpers/classes/mail';
import { InternalServerErrorException } from '@nestjs/common';
export class SendgridService {
  constructor() {
    if (!process.env.SENDGRID_API_KEY) {
      throw new Error('SENDGRID_API_KEY is missing');
    }
    if (!process.env.SENDGRID_SENDER) {
      throw new Error('SENDGRID_SENDER is missing');
    }
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  }

  async sendEmail(to: string, dynamic_template_data: { [key: string]: string }, template_id?: string) {
    const msg = {
      from: { email: process.env.SENDGRID_SENDER!, name: 'Quizzi' },
      personalizations: [
        {
          to: [{ email: to }],
          dynamic_template_data: dynamic_template_data,
        },
      ],
      template_id: template_id || 'd-50cc0f6bc2dc4ca0a48619169b30d400',
    } as unknown as MailJSON;

    try {
      console.log('[SENDGRID]  Sending email to ' + to);
      await sgMail.send(msg as MailDataRequired);
    } catch (err) {
      console.error(err);
      throw new Error('Failed to send email');
    }
  }

  async sendResetEmail(email: string, name: string, token: string) {
    const resetLink = `${process.env.EMAIL_RESET_PASSWORD_URL}?token=${encodeURIComponent(token)}`;

    const templateData = {
      name: name,
      reset_link: resetLink,
    };

    const template_id = process.env.EMAIL_RESET_TEMPLATE_ID;

    try {
      await this.sendEmail(email, templateData, template_id);
    } catch {
      throw new InternalServerErrorException('Failed to send reset email');
    }
  }
}
