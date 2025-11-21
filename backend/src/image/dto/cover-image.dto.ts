import {IsNotEmpty, IsString, IsUrl} from "class-validator";

export class DownloadCoverImageDto {
    @IsString()
    @IsUrl()
    @IsNotEmpty()
    url: string;
}
