// ===================================
// main.ts - Add static file serving
// ===================================
/*
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Serve static files for uploaded covers
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });

  await app.listen(3000);
}
bootstrap();
*/

// ===================================
// .env - Add these variables
// ===================================
/*
UPLOAD_DIR=./uploads/covers
PUBLIC_URL=http://localhost:3000
*/

// ===================================
// package.json - Add dependencies
// ===================================
/*
{
  "dependencies": {
    "@nestjs/platform-express": "^10.0.0",
    "sharp": "^0.33.0",
    "multer": "^1.4.5-lts.1"
  },
  "devDependencies": {
    "@types/multer": "^1.4.11"
  }
}
*/

// ===================================
// USAGE EXAMPLES
// ===================================

/*
1. Upload from file input:

POST /cover-images/upload
Content-Type: multipart/form-data

FormData:
  file: [image file]

Response:
{
  "id": "uuid",
  "filename": "book-cover.jpg",
  "imageUrl": "http://localhost:3000/uploads/covers/abc123.jpg",
  "thumbnailUrl": "http://localhost:3000/uploads/covers/thumb_abc123.jpg",
  "width": 1200,
  "height": 1800,
  "size": 234567
}

---

2. Download from URL:

POST /cover-images/download
Content-Type: application/json

{
  "url": "https://cdn.standaardboekhandel.be/product/9789002282119/front-medium.jpg"
}

Response:
{
  "id": "uuid",
  "originalUrl": "https://cdn.standaardboekhandel.be/...",
  "filename": "front-medium.jpg",
  "imageUrl": "http://localhost:3000/uploads/covers/def456.jpg",
  "thumbnailUrl": "http://localhost:3000/uploads/covers/thumb_def456.jpg",
  "width": 800,
  "height": 1200,
  "size": 123456
}

---

3. Get cover image details:

GET /cover-images/:id

Response:
{
  "id": "uuid",
  "imageUrl": "...",
  "thumbnailUrl": "...",
  "books": [
    {
      "id": "book-uuid",
      "title": "Het geweven geheim"
    }
  ]
}

---

4. Delete cover image:

DELETE /cover-images/:id

Response:
{
  "message": "Cover image deleted successfully"
}

---

5. Update book with cover image:

PATCH /books/:id
{
  "coverImageId": "cover-image-uuid"
}
*/
