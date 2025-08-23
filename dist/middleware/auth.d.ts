import { Request, Response, NextFunction } from 'express';
interface AuthRequest extends Request {
    admin?: any;
    employee?: any;
}
export declare const authAdmin: (req: AuthRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const authEmployee: (req: AuthRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
export {};
//# sourceMappingURL=auth.d.ts.map