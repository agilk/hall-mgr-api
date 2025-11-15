import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';
import * as SMTPTransport from 'nodemailer/lib/smtp-transport';

export interface EmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  cc?: string | string[];
  bcc?: string | string[];
  attachments?: Array<{
    filename: string;
    path?: string;
    content?: string | Buffer;
  }>;
}

@Injectable()
export class EmailService {
  private transporter: Transporter<SMTPTransport.SentMessageInfo> | null = null;
  private readonly logger = new Logger(EmailService.name);
  private readonly isConfigured: boolean;

  constructor(private configService: ConfigService) {
    const host = this.configService.get<string>('SMTP_HOST');
    const port = this.configService.get<number>('SMTP_PORT');
    const user = this.configService.get<string>('SMTP_USER');
    const password = this.configService.get<string>('SMTP_PASSWORD');

    // Check if email is configured
    this.isConfigured = !!(host && port && user && password);

    if (this.isConfigured) {
      try {
        this.transporter = nodemailer.createTransport({
          host,
          port,
          secure: port === 465, // true for 465, false for other ports
          auth: {
            user,
            pass: password,
          },
          tls: {
            rejectUnauthorized: false, // For self-signed certificates in dev
          },
        });

        this.logger.log('Email service configured successfully');
      } catch (error) {
        this.logger.error('Failed to configure email service', error.stack);
        this.transporter = null;
      }
    } else {
      this.logger.warn(
        'Email service not configured - SMTP credentials missing. Email notifications will be logged only.',
      );
    }
  }

  /**
   * Send email
   * @param options Email options
   * @returns Promise<boolean> - true if email was sent successfully, false otherwise
   */
  async sendEmail(options: EmailOptions): Promise<boolean> {
    if (!this.transporter) {
      this.logger.warn('Email not sent (SMTP not configured)', {
        to: options.to,
        subject: options.subject,
      });
      return false;
    }

    try {
      const from = this.configService.get<string>('SMTP_FROM') || options.to;

      const info = await this.transporter.sendMail({
        from,
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
        cc: options.cc,
        bcc: options.bcc,
        attachments: options.attachments,
      });

      this.logger.log(`Email sent successfully: ${info.messageId}`, {
        to: options.to,
        subject: options.subject,
      });

      return true;
    } catch (error) {
      this.logger.error('Failed to send email', {
        error: error.message,
        to: options.to,
        subject: options.subject,
        stack: error.stack,
      });
      return false;
    }
  }

  /**
   * Send assignment notification email
   */
  async sendAssignmentNotification(
    email: string,
    supervisorName: string,
    examName: string,
    roomName: string,
    examDate: string,
    examTime: string,
  ): Promise<boolean> {
    const subject = `New Exam Assignment: ${examName}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c3e50;">New Exam Assignment</h2>
        <p>Dear ${supervisorName},</p>
        <p>You have been assigned to supervise an exam:</p>
        <div style="background-color: #f8f9fa; padding: 15px; border-left: 4px solid #3498db; margin: 20px 0;">
          <p><strong>Exam:</strong> ${examName}</p>
          <p><strong>Room:</strong> ${roomName}</p>
          <p><strong>Date:</strong> ${examDate}</p>
          <p><strong>Time:</strong> ${examTime}</p>
        </div>
        <p>Please confirm your attendance at your earliest convenience.</p>
        <p>Best regards,<br/>Exam Supervision System</p>
      </div>
    `;
    const text = `Dear ${supervisorName},\n\nYou have been assigned to supervise an exam:\n\nExam: ${examName}\nRoom: ${roomName}\nDate: ${examDate}\nTime: ${examTime}\n\nPlease confirm your attendance at your earliest convenience.\n\nBest regards,\nExam Supervision System`;

    return this.sendEmail({
      to: email,
      subject,
      html,
      text,
    });
  }

  /**
   * Send violation alert email
   */
  async sendViolationAlert(
    email: string,
    managerName: string,
    violationType: string,
    examName: string,
    roomName: string,
    severity: string,
  ): Promise<boolean> {
    const subject = `[${severity.toUpperCase()}] Violation Reported: ${examName}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #e74c3c;">Exam Violation Alert</h2>
        <p>Dear ${managerName},</p>
        <p>A violation has been reported during an exam:</p>
        <div style="background-color: #fff3cd; padding: 15px; border-left: 4px solid #e74c3c; margin: 20px 0;">
          <p><strong>Severity:</strong> <span style="color: #e74c3c; font-weight: bold;">${severity.toUpperCase()}</span></p>
          <p><strong>Type:</strong> ${violationType}</p>
          <p><strong>Exam:</strong> ${examName}</p>
          <p><strong>Room:</strong> ${roomName}</p>
        </div>
        <p>Please review this violation and take appropriate action.</p>
        <p>Best regards,<br/>Exam Supervision System</p>
      </div>
    `;
    const text = `Dear ${managerName},\n\nA violation has been reported during an exam:\n\nSeverity: ${severity.toUpperCase()}\nType: ${violationType}\nExam: ${examName}\nRoom: ${roomName}\n\nPlease review this violation and take appropriate action.\n\nBest regards,\nExam Supervision System`;

    return this.sendEmail({
      to: email,
      subject,
      html,
      text,
    });
  }

  /**
   * Send sync failure notification
   */
  async sendSyncFailureNotification(
    email: string,
    syncType: string,
    errorMessage: string,
  ): Promise<boolean> {
    const subject = `Sync Failure: ${syncType}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #e74c3c;">Synchronization Failure</h2>
        <p>A synchronization job has failed:</p>
        <div style="background-color: #f8d7da; padding: 15px; border-left: 4px solid #e74c3c; margin: 20px 0;">
          <p><strong>Sync Type:</strong> ${syncType}</p>
          <p><strong>Error:</strong> ${errorMessage}</p>
        </div>
        <p>Please check the system logs for more details.</p>
        <p>Best regards,<br/>Exam Supervision System</p>
      </div>
    `;
    const text = `A synchronization job has failed:\n\nSync Type: ${syncType}\nError: ${errorMessage}\n\nPlease check the system logs for more details.\n\nBest regards,\nExam Supervision System`;

    return this.sendEmail({
      to: email,
      subject,
      html,
      text,
    });
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(
    email: string,
    name: string,
    resetToken: string,
    resetUrl: string,
  ): Promise<boolean> {
    const subject = 'Password Reset Request';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c3e50;">Password Reset Request</h2>
        <p>Dear ${name},</p>
        <p>We received a request to reset your password. Click the button below to reset it:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #3498db; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
        </div>
        <p>Or copy and paste this link in your browser:</p>
        <p style="color: #7f8c8d; word-break: break-all;">${resetUrl}</p>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
        <p>Best regards,<br/>Exam Supervision System</p>
      </div>
    `;
    const text = `Dear ${name},\n\nWe received a request to reset your password. Click the link below to reset it:\n\n${resetUrl}\n\nThis link will expire in 1 hour.\n\nIf you didn't request this, please ignore this email.\n\nBest regards,\nExam Supervision System`;

    return this.sendEmail({
      to: email,
      subject,
      html,
      text,
    });
  }

  /**
   * Check if email service is configured
   */
  isEmailConfigured(): boolean {
    return this.isConfigured;
  }
}
