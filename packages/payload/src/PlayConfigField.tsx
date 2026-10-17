'use client';

import { PlayEditor, toLang, type MediaOption } from '@hello-eme/play-editor/react';
import { useConfig, useField, useTranslation } from '@payloadcms/ui';
import type { JSONFieldClientProps } from 'payload';
import { useEffect, useState } from 'react';

export type PlayConfigFieldProps = JSONFieldClientProps & {
	/** Slug of the upload collection the pictures come from (default `media`). */
	mediaCollection?: string;
	/** A page that plays the configuration sent by the admin (the game's `data-preview` mode). */
	previewUrl?: string;
	supportUrl?: string;
};

interface MediaDoc {
	filename?: string | null;
	url?: string | null;
	mimeType?: string | null;
}

const toOption = (doc: MediaDoc): MediaOption[] =>
	doc.url ? [{ url: doc.url, label: doc.filename ?? doc.url }] : [];

/** Images of the media collection, for the picture picker. Empty when the request fails. */
function useMedia(apiRoute: string, collection: string, reload: number): MediaOption[] {
	const [media, setMedia] = useState<MediaOption[]>([]);
	useEffect(() => {
		const controller = new AbortController();
		fetch(`${apiRoute}/${collection}?limit=100&where[mimeType][like]=image`, {
			credentials: 'include',
			signal: controller.signal
		})
			.then((response) => (response.ok ? response.json() : { docs: [] }))
			.then((body: { docs?: MediaDoc[] }) => setMedia((body.docs ?? []).flatMap(toOption)))
			.catch(() => undefined);
		return () => controller.abort();
	}, [apiRoute, collection, reload]);
	return media;
}

/**
 * Payload's field for the game's JSON: the shared editor (`@hello-eme/play-editor`) wired to the
 * form value, the media collection and the admin language. Everything it shows is the editor's.
 */
export function PlayConfigField({
	path,
	mediaCollection = 'media',
	previewUrl,
	supportUrl
}: PlayConfigFieldProps) {
	const { value, setValue } = useField<unknown>({ path });
	const { i18n } = useTranslation();
	const { config: payloadConfig } = useConfig();
	const apiRoute = payloadConfig.routes.api;
	const [uploads, setUploads] = useState(0);
	const media = useMedia(apiRoute, mediaCollection, uploads);

	/** Uploads into the media collection, like the admin's own upload form does. */
	const onUpload = async (file: File): Promise<string> => {
		const body = new FormData();
		body.append('file', file);
		body.append('_payload', JSON.stringify({ alt: file.name }));
		const response = await fetch(`${apiRoute}/${mediaCollection}`, {
			method: 'POST',
			credentials: 'include',
			body
		});
		if (!response.ok) throw new Error(`Upload failed (${response.status})`);
		const result: { doc?: MediaDoc } = await response.json();
		const url = result.doc?.url;
		if (!url) throw new Error('The upload gave no address.');
		setUploads((count) => count + 1);
		return url;
	};

	return (
		<div className="field-type">
			<PlayEditor
				value={value ?? {}}
				onChange={setValue}
				lang={toLang(i18n.language)}
				defaultMode="expert"
				media={media}
				mediaUploadHref={`${payloadConfig.routes.admin}/collections/${mediaCollection}/create`}
				onUpload={onUpload}
				{...(previewUrl ? { previewUrl } : {})}
				{...(supportUrl ? { supportUrl } : {})}
			/>
		</div>
	);
}
