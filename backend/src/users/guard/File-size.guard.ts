import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import * as multer from "multer";

@Injectable()
export class FileSizeGuard implements CanActivate {

    private readonly MAX_FILE_SIZE_BYTES = 1000000;

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest() as Request;

        const fileSizeBytes = request.headers.get("content-length") || Infinity ;
        if (!fileSizeBytes) {
            return false;
        }
        return +fileSizeBytes <= this.MAX_FILE_SIZE_BYTES;
    }
    }
