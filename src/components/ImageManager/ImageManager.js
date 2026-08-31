'use client';

import { useState } from 'react';

import { uploadMedia } from '../../lib/adminApi';
import {
  addImage,
  removeImage,
  reorderImages,
  setPrimary,
  synthesizePublicId,
} from '../../lib/product';
import styles from './ImageManager.module.css';

let tmpCounter = 0;
const nextTmpId = () => `tmp-${Date.now()}-${tmpCounter++}`;

// Working list shape: { tmpId, url, public_id, alt_text, is_primary }
export default function ImageManager({ value, onChange, slug }) {
  const list = value || [];
  const [uploading, setUploading] = useState(false);
  const [uploadBlocked, setUploadBlocked] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [urlDraft, setUrlDraft] = useState('');

  const update = (next) => onChange(next);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file
    if (!file) return;
    setUploading(true);
    setUploadError('');
    try {
      const { url, public_id } = await uploadMedia(file);
      update(
        addImage(list, {
          tmpId: nextTmpId(),
          url,
          public_id,
          alt_text: '',
          is_primary: list.length === 0,
        })
      );
    } catch (err) {
      if (err?.status === 503) {
        setUploadBlocked(true);
      } else if (err?.status === 415) {
        setUploadError('That image type isn’t supported (use JPEG, PNG, WebP or AVIF).');
      } else if (err?.status === 413) {
        setUploadError('That image is over the 10 MB limit.');
      } else {
        setUploadError('Upload failed. Please try again.');
      }
    } finally {
      setUploading(false);
    }
  };

  const addUrl = () => {
    const url = urlDraft.trim();
    if (!url) return;
    update(
      addImage(list, {
        tmpId: nextTmpId(),
        url,
        public_id: synthesizePublicId(slug, list),
        alt_text: '',
        is_primary: list.length === 0,
      })
    );
    setUrlDraft('');
  };

  const setAlt = (index, alt_text) =>
    update(list.map((img, i) => (i === index ? { ...img, alt_text } : img)));

  return (
    <div className={styles.wrap}>
      <p className={styles.heading}>Images</p>

      {(uploadBlocked || uploadError) && (
        <p className={styles.notice} role="alert">
          {uploadBlocked
            ? 'Image hosting isn’t configured. Add images by URL below, or set CLOUDINARY_* in the backend .env.'
            : uploadError}
        </p>
      )}

      <div className={styles.addRow}>
        {!uploadBlocked && (
          <label className={styles.uploadBtn}>
            {uploading ? 'Uploading…' : 'Upload image'}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              onChange={handleFile}
              disabled={uploading}
              hidden
            />
          </label>
        )}
        <input
          type="url"
          className={styles.urlInput}
          placeholder="…or paste an image URL (Cloudinary / Pexels)"
          value={urlDraft}
          onChange={(e) => setUrlDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addUrl();
            }
          }}
        />
        <button type="button" className={styles.smallBtn} onClick={addUrl}>
          Add URL
        </button>
      </div>

      {list.length === 0 ? (
        <p className={styles.empty}>No images yet.</p>
      ) : (
        <ul className={styles.list}>
          {list.map((img, index) => (
            <li key={img.tmpId} className={styles.item}>
              {/* Plain <img>: admins may paste URLs from hosts next/image doesn't allow. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className={styles.thumb} src={img.url} alt="" />
              <div className={styles.fields}>
                <input
                  type="text"
                  className={styles.altInput}
                  placeholder="Alt text (describe the image)"
                  value={img.alt_text}
                  onChange={(e) => setAlt(index, e.target.value)}
                />
                <div className={styles.controls}>
                  <label className={styles.primaryLabel}>
                    <input
                      type="radio"
                      name="primary-image"
                      checked={img.is_primary}
                      onChange={() => update(setPrimary(list, index))}
                    />
                    Primary
                  </label>
                  <button
                    type="button"
                    className={styles.iconBtn}
                    onClick={() => update(reorderImages(list, index, index - 1))}
                    disabled={index === 0}
                    aria-label="Move up"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className={styles.iconBtn}
                    onClick={() => update(reorderImages(list, index, index + 1))}
                    disabled={index === list.length - 1}
                    aria-label="Move down"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    className={styles.removeBtn}
                    onClick={() => update(removeImage(list, index))}
                  >
                    Remove
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
