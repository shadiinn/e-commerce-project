# Cloudinary setup (no separate image upload server)

This project uploads new and recropped product images directly from Angular to Cloudinary. JSON Server still stores product records; `images` and `originalImages` contain HTTPS URLs rather than Base64 data.

## 1. Create a Cloudinary account

Open https://cloudinary.com/ and create/sign in to your account. In the Cloudinary Console, find your **Cloud name**.

## 2. Create an unsigned upload preset

1. Open **Settings → Upload → Upload presets** in the Cloudinary Console.
2. Create a new preset and set its signing mode to **Unsigned**.
3. Restrict uploads to image formats you need (for example, JPG, JPEG, PNG, and WebP) and set a reasonable maximum file size.
4. Save the preset and copy its exact name.

Unsigned presets can be used by anyone who learns the preset name. Restrict the preset as much as Cloudinary allows, monitor usage, and do not use this setup as a substitute for server-side authorization in a production store.

## 3. Add your public configuration values

Open:

`src/app/core/config/cloudinary.config.ts`

Replace the two placeholders:

```ts
export const CLOUDINARY_CLOUD_NAME = 'YOUR_CLOUD_NAME';
export const CLOUDINARY_UPLOAD_PRESET = 'YOUR_UNSIGNED_UPLOAD_PRESET';
```

Use your Cloudinary **Cloud name** and **unsigned preset name**. Do not add your API secret to this file or anywhere in Angular.

## 4. Run the application

Run the Angular app and JSON Server as you normally do. There is no image upload server to start.

When an admin saves a product:

- New images are uploaded as original + cropped versions.
- When an existing Cloudinary image is recropped, only the new crop is uploaded and the original URL is kept.
- Existing local image paths remain unchanged.
- The product record is saved to `db.json` with Cloudinary URLs.

If Cloudinary upload fails, the product save is stopped and an error is shown. A failed product save may leave an uploaded image unused in Cloudinary; remove unused assets from the Cloudinary Media Library if needed.
