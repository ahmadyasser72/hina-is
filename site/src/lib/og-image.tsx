/** @jsxImportSource react */
import { ImageResponse } from "@takumi-rs/image-response";
import type { ReactNode } from "react";

interface OgImageOptions {
	title: string;
	description: string;
	persistentImages?: { src: string; data: ArrayBuffer }[];
}

export function createOgImage({
	title,
	description,
	persistentImages,
}: OgImageOptions) {
	return new ImageResponse(
		<DocsTemplate
			title={title}
			description={description}
			icon={<img src="icon" height={48} width={48} />}
			primaryColor="#55ddee"
			primaryTextColor="#55ddee"
			site="hina-is"
		/>,
		{
			width: 1200,
			height: 630,
			format: "webp",
			persistentImages,
		},
	);
}

// https://github.com/kane50613/takumi/blob/master/takumi-template/src/templates/docs-template.tsx
const DocsTemplate = ({
	title,
	description,
	icon,
	primaryColor,
	primaryTextColor,
	site,
}: {
	title: ReactNode;
	description: ReactNode;
	icon: ReactNode;
	primaryColor: string;
	primaryTextColor: string;
	site: ReactNode;
}) => (
	<div
		style={{
			width: "100%",
			height: "100%",
			backgroundColor: "#050505",
			position: "relative",
			display: "flex",
			flexDirection: "column",
			overflow: "hidden",
			color: "white",
			backgroundImage: `linear-gradient(to bottom right, ${primaryColor}, transparent)`,
		}}
	>
		<div
			style={{
				display: "flex",
				flexDirection: "column",
				width: "100%",
				height: "100%",
				padding: "60px",
				position: "relative",
				justifyContent: "space-between",
			}}
		>
			<div
				style={{
					display: "flex",
					flexDirection: "column",
					gap: "32px",
					marginBottom: "40px",
					textWrap: "pretty",
				}}
			>
				<span
					style={{
						fontSize: 72,
						fontWeight: 800,
						lineHeight: 1.1,
						letterSpacing: "-0.04em",
						color: "white",
					}}
				>
					{title}
				</span>
				<span
					style={{
						fontSize: 44,
						color: "#a1a1aa",
						fontWeight: 400,
						lineHeight: 1.4,
						maxWidth: "95%",
						letterSpacing: "-0.01em",
						lineClamp: 2,
						textOverflow: "ellipsis",
						overflow: "hidden",
					}}
				>
					{description}
				</span>
			</div>

			<div
				style={{
					display: "flex",
					alignItems: "center",
					gap: "28px",
				}}
			>
				{icon}
				<span
					style={{
						fontSize: 32,
						fontWeight: 700,
						letterSpacing: "-0.02em",
						color: "white",
						opacity: 0.9,
					}}
				>
					{site}
				</span>
				<div style={{ flexGrow: 1 }} />
				<div
					style={{
						height: 4,
						width: 60,
						backgroundColor: primaryColor,
						borderRadius: 2,
					}}
				/>
				<span
					style={{
						fontSize: 22,
						fontWeight: 700,
						textTransform: "uppercase",
						letterSpacing: "0.2em",
						color: primaryTextColor,
						opacity: 0.8,
					}}
				>
					Fan site
				</span>
			</div>
		</div>
	</div>
);
