/** The browser side of adding a picture: reading its size and (without a host upload) embedding it. */
import type { ImageInfo } from './sprites.js';

/** The file's size in pixels. SVGs without a size of their own report 0 × 0. */
export function readImage(file: File): Promise<ImageInfo> {
	const info = (width: number, height: number): ImageInfo => ({
		width,
		height,
		bytes: file.size,
		type: file.type
	});
	if (!file.type.startsWith('image/')) return Promise.resolve(info(0, 0));
	return new Promise((resolve) => {
		const url = URL.createObjectURL(file);
		const image = new Image();
		image.onload = () => {
			URL.revokeObjectURL(url);
			resolve(info(image.naturalWidth, image.naturalHeight));
		};
		image.onerror = () => {
			URL.revokeObjectURL(url);
			resolve(info(0, 0));
		};
		image.src = url;
	});
}

/** The file as a `data:` URL, so the picture travels inside the JSON. */
export function toDataUrl(file: File): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => resolve(String(reader.result));
		reader.onerror = () => reject(reader.error ?? new Error('Could not read the file.'));
		reader.readAsDataURL(file);
	});
}
