import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

interface CloudinaryUploadResponse {
  secure_url: string;
  public_id: string;
  format: string;
}

const CLOUDINARY_CLOUD_NAME = 'ww4yzcj6';
const CLOUDINARY_UPLOAD_PRESET = 'SA-product-photos';

type ProductImageKind = 'original' | 'cropped';

@Injectable({ providedIn: 'root' })
export class ProductImageUploadService {
  private readonly http = inject(HttpClient);

  /**
   * Uploads an image directly from Angular to Cloudinary.
   * No separate image upload server is required.
   */
  async uploadImage(
    dataUrl: string,
    productName: string,
    color: string,
    kind: ProductImageKind
  ): Promise<string> {
    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
      throw new Error('Cloudinary configuration is missing.');
    }

    // Convert the image data URL into a Blob.
    const blob = await (await fetch(dataUrl)).blob();

    const extension =
      blob.type === 'image/png' ? 'png' : 'jpg';

    // Generate a unique image name.
    const publicId = [
      productName,
      color,
      kind,
      this.uniqueSuffix()
    ]
      .map(value => this.slug(value))
      .filter(Boolean)
      .join('-');

    // Prepare the upload request.
    const body = new FormData();

    body.append('file', blob, `${publicId}.${extension}`);
    body.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    body.append('folder', 'ecommerce-products');
    body.append('public_id', publicId);

    // Correct Cloudinary image upload endpoint.
    const endpoint =
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

    // Upload the image.
    const response = await firstValueFrom(
      this.http.post<CloudinaryUploadResponse>(
        endpoint,
        body
      )
    );

    if (!response.secure_url) {
      throw new Error(
        'Cloudinary did not return an image URL.'
      );
    }

    return response.secure_url;
  }

  private slug(value: string): string {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  private uniqueSuffix(): string {
    return `${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 9)}`;
  }
}