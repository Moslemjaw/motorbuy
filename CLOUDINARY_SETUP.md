# Cloudinary Setup

This project uses Cloudinary for image storage to ensure images persist across deployments.

## Configuration

Add your Cloudinary connection string to your environment variables:

```bash
CLOUDINARY_CONNECTION_STRING=cloudinary://api_key:api_secret@cloud_name
```

Or use individual environment variables:

```bash
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

## Example

```bash
CLOUDINARY_CONNECTION_STRING=cloudinary://525168948871956:q4Qf-Y32H9yVJYm-G-m1ufJ15Ns@dyxzbgiic
```

## How It Works

1. When files are uploaded via `/api/uploads/direct-upload`, they are automatically uploaded to Cloudinary
2. Images are stored in the `motorbuy/uploads` folder on Cloudinary
3. The secure URL is returned and stored in the database
4. Images are served directly from Cloudinary CDN

## Fallback

If Cloudinary is not configured, the system will fall back to local file storage in `server/public/uploads/`.

