---
name: x-uploads
description: File upload standard - the presigned direct-to-storage flow, BFF endpoints, validation of type and size, progress and cancel, the accessible UploadDropzone, image previews, form integration, large-file resumable uploads (tus/Uppy) and cleanup of orphaned files. Use whenever you add file, image, avatar, document or attachment upload or download, a dropzone, or file validation, or when uploads are slow, unreliable or going through the app server.
---

# Uploads

**Files never pass through the Next.js server or the BFF proxy.** The browser uploads straight to object storage (S3-compatible) with a presigned URL.

## Flow

```
1. POST /api/uploads/presign   { purpose, filename, contentType, size }        → BFF → NestJS
   ← { uploadUrl, method, headers, fileKey, expiresAt }
2. Browser PUTs the file to uploadUrl (XMLHttpRequest for progress events; AbortController/xhr.abort for cancel)
3. POST /api/uploads/confirm   { fileKey }                                      → backend verifies object, size, type; starts scanning
   ← { file: { id, key, status: 'pending-scan' | 'ready', ... } }
4. The form stores the returned file id/key; the entity mutation references it.
```

Downloads use presigned GET URLs requested on demand (short expiry); never expose permanent public URLs for private files. Public assets are served from the CDN host configured in `next/image` `remotePatterns` (`next-assets`).

## Validation (both sides; the server is authoritative)

- Allowed MIME types and max size come from a per-`purpose` table in `@scope/contracts` (e.g. `avatar`: images up to 5 MB; `attachment`: documents up to 25 MB). The client uses it for fast feedback; the backend re-validates and checks the real content type (magic bytes).
- Reject early with a clear message (`messages.ts`/i18n): type, size, count.
- Files are scanned server-side; UI shows `pending-scan` until `ready`. Never render an unscanned file as trusted content.

## Resumable and large files

Default single presigned PUT is for files up to about 100 MB (project may adjust in config). Above that use multipart or **tus/Uppy** with resumable uploads and retry; enable per purpose, not globally. Document the threshold in `orchestra.config.json`.

## UploadDropzone (`packages/ui`)

- Accessible: a real `<input type="file">` with a visible label/button; drag-and-drop is an enhancement; keyboard operable; drop zone has a text instruction and focus style.
- States: idle, drag-over, uploading (progress bar with `role="progressbar"` and values), success, error with retry, cancel.
- Props: `accept`, `maxSize`, `multiple`, `onUpload(file) → Promise<UploadedFile>`, `onChange`, `disabled`. It knows nothing about contracts or features.
- Image previews: `URL.createObjectURL` and **revoke on cleanup**.
- Concurrency limit (3 parallel uploads by default); per-file status.

## Form integration

The form field value is the uploaded file reference (`{ id, key, name }`), not the `File`. Submit stays disabled while any upload is in flight. Removing a file in the UI removes the reference; the backend lifecycle rule deletes orphaned unreferenced objects after a grace period (backend responsibility; confirm and record).

## Storage configuration (backend/infra, record in the project)

Bucket CORS allows the app origin for `PUT`/`GET`; private by default; server-side encryption; lifecycle rules for abandoned multipart uploads and orphan cleanup; CDN in front of public assets.

## Anti-patterns

- `FormData` uploads to `/api/...` or Server Actions.
- Using `fetch` for upload progress (use XHR or a library that exposes it).
- Trusting `file.type` or the extension alone.
- Storing `File` objects in forms or stores.
- Permanent public URLs for private documents.
- Leaking object URLs.
