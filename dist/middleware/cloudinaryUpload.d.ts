import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
export declare const cloudinaryUpload: multer.Multer;
export declare const uploadMultipleToCloudinary: import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
export declare const deleteFromCloudinary: (publicId: string) => Promise<any>;
export declare const getOptimizedUrl: (publicId: string, options?: any) => string;
export { cloudinary };
//# sourceMappingURL=cloudinaryUpload.d.ts.map