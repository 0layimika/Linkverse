export declare class AuthService {
    static register(data: {
        email: string;
        password: string;
        confirmPassword: string;
    }): Promise<import("@0layimika/api-response-kit").ApiError | import("@0layimika/api-response-kit").ApiSuccess<{
        user: import("../models/UserModel").UserModelType;
    }>>;
    static verify(token: string): Promise<import("@0layimika/api-response-kit").ApiError | import("@0layimika/api-response-kit").ApiSuccess<{
        user: import("../models/UserModel").UserModelType;
        token: string;
    }>>;
    static forgotPassword(email: string): Promise<import("@0layimika/api-response-kit").ApiError | import("@0layimika/api-response-kit").ApiSuccess<null>>;
    static resetPassword(token: string, newPassword: string): Promise<import("@0layimika/api-response-kit").ApiError | import("@0layimika/api-response-kit").ApiSuccess<null>>;
    static login({ email, password }: {
        email: string;
        password: string;
    }): Promise<import("@0layimika/api-response-kit").ApiError | import("@0layimika/api-response-kit").ApiSuccess<{
        creator: import("../repositories/CreatorRepository").Creator;
        token: string;
    }>>;
    static resendVerificationLink(email: string): Promise<import("@0layimika/api-response-kit").ApiError | import("@0layimika/api-response-kit").ApiSuccess<null>>;
    static resendForgotPasswordLink(email: string): Promise<import("@0layimika/api-response-kit").ApiError | import("@0layimika/api-response-kit").ApiSuccess<null>>;
}
//# sourceMappingURL=auth.service.d.ts.map