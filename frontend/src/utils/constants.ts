import type { ProtectionStage } from "../types/layer";

export const ROUTES = {
	home: "/",
	protect: "/protect",
	pricing: "/pricing",
} as const;

export const BRAND = {
	name: "ARTSHIELD",
	tagline: "PROTECT THE ART. PROVE THE ORIGINAL.",
} as const;

export type NavLink = {
	label: string;
	href: string;
	placeholder?: boolean;
	isRoute?: boolean;
};

export const NAV_LINKS: NavLink[] = [
	{ label: "Protection", href: "/#protection" },
	{ label: "Verification", href: "/#verification" },
	{ label: "Technology", href: "/#technology" },
	{ label: "Provenance", href: "/#provenance" },
	{ label: "Early Access", href: "/pricing", isRoute: true },
];

export const CAPABILITIES = [
	"SHA-256 fingerprint",
	"LSB watermark",
	"AI Shield perturbation",
	"Registry record",
	"Integrity verification",
] as const;

export const PROTECTION_STAGES: ProtectionStage[] = [
	{
		id: "identity",
		index: "01",
		name: "Identity",
		title: "Cryptographic identity",
		technical: "SHA-256 · Metadata-bound",
		description: "The source image and its metadata are hashed into a SHA-256 fingerprint: a stable identity for the artwork that every later step refers back to.",
	},
	{
		id: "watermark",
		index: "02",
		name: "Watermark",
		title: "Embedded watermark",
		technical: "LSB · Steganographic",
		description: "A bounded least-significant-bit watermark is written into the pixels themselves, carrying your chosen mark without visibly changing the work.",
	},
	{
		id: "ai-shield",
		index: "03",
		name: "AI Shield",
		title: "Adversarial perturbation",
		technical: "AI Shield · Deterministic frequency perturbation",
		description: "A deterministic perturbation is applied to the protected artifact, intended to degrade its value as training data for models that harvest images without consent.",
	},
	{
		id: "integrity",
		index: "04",
		name: "Integrity",
		title: "Integrity verification",
		technical: "Hash · Watermark checks",
		description: "The protected artifact can be checked against its fingerprint and embedded watermark reference.",
	},
	{
		id: "provenance",
		index: "05",
		name: "Provenance",
		title: "Registry provenance",
		technical: "Registry record · On-chain in development",
		description: "The artifact fingerprint and processing details can be retained as a registry record. Public blockchain anchoring is in development.",
	},
	{
		id: "rights",
		index: "06",
		name: "Rights",
		title: "Usage-rights declaration",
		technical: "Declaration · Enforcement in development",
		description: "A usage-rights declaration can describe intended permissions. Full production rights enforcement is in development.",
	},
];

export interface PricingTier {
	id: string;
	name: string;
	tag: string;
	price: string;
	period: string;
	description: string;
	features: string[];
	highlighted?: boolean;
	ctaText: string;
	ctaLink: string;
}

export const PRICING_TIERS: PricingTier[] = [
	{
		id: "explorer",
		name: "Explorer",
		tag: "CURRENT BETA",
		price: "BETA",
		period: "Current workspace",
		description: "Beta access to the current protection and verification workflow.",
		features: [
			"Beta protection workflow",
			"SHA-256 cryptographic fingerprinting",
			"LSB watermark embedding",
			"Browser-saved verification references",
			"Local verification reference persistence",
			"Standard PNG artifact export",
		],
		ctaText: "Open Beta Workspace",
		ctaLink: "/protect",
	},
	{
		id: "creator",
		name: "Creator",
		tag: "PLANNED MODEL",
		price: "PLANNED",
		period: "Access model",
		description: "Early access to the current deterministic AI Shield processing workflow.",
		features: [
			"Beta workflow access",
		"AI Shield - Deterministic frequency perturbation",
		"Steganographic watermark embedding",
			"On-chain anchoring in development",
			"Registry records where configured",
			"Single artifact processing",
			"Browser-saved verification reference",
		],
		highlighted: true,
		ctaText: "Explore Beta Workflow",
		ctaLink: "/protect",
	},
	{
		id: "studio",
		name: "Studio",
		tag: "PLANNED MODEL",
		price: "PLANNED",
		period: "Access model",
		description: "A planned access model for studios and institutions. Commercial features are in development.",
		features: [
			"Everything in Creator tier",
			"Usage-rights declaration workflow",
			"Ownership workflows in development",
			"API access model in development",
			"Registry integration planning",
			"ML service availability depends on deployment",
			"Studio access model in development",
		],
		ctaText: "Explore Planned Access",
		ctaLink: "/protect",
	},
];
