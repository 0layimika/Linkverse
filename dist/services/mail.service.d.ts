export declare class MailService {
    private static sendEmail;
    static sendVerificationEmail(email: string, verificationLink: string): Promise<boolean>;
    static sendForgotPasswordEmail(email: string, resetLink: string): Promise<boolean>;
    static sendTipNotificationEmail(creatorEmail: string, creatorName: string, amount: number, senderName: string, message?: string): Promise<boolean>;
}
//# sourceMappingURL=mail.service.d.ts.map