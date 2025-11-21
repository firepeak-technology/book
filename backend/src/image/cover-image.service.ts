import {BadRequestException, Injectable, NotFoundException} from '@nestjs/common';
import {PrismaService} from '../prisma/prisma.service';
import {ConfigService} from '@nestjs/config';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as sharp from 'sharp';
import * as crypto from 'crypto';
import axios from 'axios';

@Injectable()
export class CoverImageService {
    private readonly uploadDir: string;
    private readonly publicUrl: string;
    private readonly thumbnailWidth = 200;
    private readonly thumbnailHeight = 300;

    constructor(
        private prisma: PrismaService,
        private config: ConfigService,
    ) {
        this.uploadDir = '/app/uploads';
        console.log(this.uploadDir)
        this.publicUrl = this.config.get('PUBLIC_URL') || 'http://localhost:3000';
        this.ensureUploadDirExists();
    }

    private async ensureUploadDirExists() {
        try {
            await fs.access(this.uploadDir);
        } catch {
            await fs.mkdir(this.uploadDir, {recursive: true});
        }
    }

    /**
     * Upload cover image from file input
     */
    async uploadFromFile(file: Express.Multer.File) {
        // Validate file type
        if (!file.mimetype.startsWith('image/')) {
            throw new BadRequestException('File must be an image');
        }

        // Generate unique filename
        const fileHash = crypto.randomBytes(16).toString('hex');
        const ext = path.extname(file.originalname);
        const filename = `${fileHash}${ext}`;

        const imagePath = path.join(this.uploadDir, filename);
        const thumbnailPath = path.join(this.uploadDir, `thumb_${filename}`);

        // Save original image
        await fs.writeFile(imagePath, file.buffer);

        // Get image dimensions
        const metadata = await sharp(file.buffer).metadata();

        // Generate thumbnail
        await sharp(file.buffer)
            .resize(this.thumbnailWidth, this.thumbnailHeight, {
                fit: 'cover',
                position: 'centre',
            })
            .toFile(thumbnailPath);

        // Create database record
        const coverImage = await this.prisma.coverImage.create({
            data: {
                originalUrl: null,
                filename: file.originalname,
                mimeType: file.mimetype,
                size: file.size,
                imagePath: imagePath,
                imageUrl: `/uploads/covers/${filename}`,
                thumbnailPath: thumbnailPath,
                thumbnailUrl: `/uploads/covers/thumb_${filename}`,
                width: metadata.width,
                height: metadata.height,
            },
        });

        return coverImage;
    }

    /**
     * Download cover image from URL
     */
    async downloadFromUrl(url: string) {
        console.log(`Downloading ${url}`);
        try {
            // Download image
            const response = await axios.get(url, {
                responseType: 'arraybuffer',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                },
            });

            const buffer = Buffer.from(response.data);
            const contentType = response.headers['content-type'];

            // Validate it's an image
            if (!contentType.startsWith('image/')) {
                throw new BadRequestException('URL does not point to an image');
            }

            // Generate unique filename
            const fileHash = crypto.randomBytes(16).toString('hex');
            const ext = contentType === 'image/jpeg' ? '.jpg' :
                contentType === 'image/png' ? '.png' :
                    contentType === 'image/webp' ? '.webp' : '.jpg';
            const filename = `${fileHash}${ext}`;

            const imagePath = path.join(this.uploadDir, filename);
            const thumbnailPath = path.join(this.uploadDir, `thumb_${filename}`);
            console.log(`Saving to ${imagePath}`);
            console.log(`Saving to ${thumbnailPath}`);

            // Save original image
            await fs.writeFile(imagePath, buffer);

            // Get image dimensions
            const metadata = await sharp(buffer).metadata();

            // Generate thumbnail
            await sharp(buffer)
                .resize(this.thumbnailWidth, this.thumbnailHeight, {
                    fit: 'cover',
                    position: 'centre',
                })
                .toFile(thumbnailPath);

            // Extract filename from URL
            const urlFilename = url.split('/').pop()?.split('?')[0] || 'downloaded-image';

            // Create database record
            const coverImage = await this.prisma.coverImage.create({
                data: {
                    originalUrl: url,
                    filename: urlFilename,
                    mimeType: contentType,
                    size: buffer.length,
                    imagePath: imagePath,
                    imageUrl: `/uploads/covers/${filename}`,
                    thumbnailPath: thumbnailPath,
                    thumbnailUrl: `/uploads/covers/thumb_${filename}`,
                    width: metadata.width,
                    height: metadata.height,
                },
            });

            return coverImage;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                throw new BadRequestException(`Failed to download image: ${error.message}`);
            }
            throw error;
        }
    }

    /**
     * Find cover image by ID
     */
    async findOne(id: string) {
        const coverImage = await this.prisma.coverImage.findUnique({
            where: {id},
            include: {
                books: {
                    select: {
                        id: true,
                        title: true,
                    },
                },
            },
        });

        if (!coverImage) {
            throw new NotFoundException(`Cover image with ID ${id} not found`);
        }

        return coverImage;
    }

    /**
     * Delete cover image
     */
    async remove(id: string) {
        const coverImage = await this.findOne(id);

        // Delete files from disk
        try {
            await fs.unlink(coverImage.imagePath);
            await fs.unlink(coverImage.thumbnailPath);
        } catch (error) {
            console.error('Error deleting files:', error);
        }

        // Delete database record
        await this.prisma.coverImage.delete({
            where: {id},
        });

        return {message: 'Cover image deleted successfully'};
    }

    /**
     * Get all cover images
     */
    async findAll() {
        return this.prisma.coverImage.findMany({
            orderBy: {
                createdAt: 'desc',
            },
            include: {
                _count: {
                    select: {
                        books: true,
                    },
                },
            },
        });
    }
}
