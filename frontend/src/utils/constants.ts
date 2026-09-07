import type { ProtectionStage } from "../types/layer";

export const ROUTES = {
	home: "/",
	protect: "/protect",
	pricing: "/pricing",
} as const;

export const BRAND = {
	name: "ARTSHIELD",
	tagline: "PROTECT. PROVE. CONTROL.",
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
	{ label: "Pricing", href: "#", placeholder: true },
	{ label: "Verification", href: "/#verification" },
	{ label: "Pricing", href: "/pricing", isRoute: true },
];

export const CAPABILITIES = [
	"SHA-256 fingerprint",
	"Steganographic watermark",
	"Adversarial perturbation",
	"Blockchain certificate",
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
		technical: "Deterministic perturbation",
		description: "A deterministic perturbation is applied to the protected artifact, intended to degrade its value as training data for models that harvest images without consent.",
	},
	{
		id: "provenance",
		index: "04",
		name: "Provenance",
		title: "Blockchain provenance",
		technical: "Certificate · Ownership · Rights",
		description: "Using the fingerprint, ArtShield can issue a certificate of authenticity, register ownership, record provenance and manage usage rights on chain through its backend.",
	},
	{
		id: "verification",
		index: "05",
		name: "Verification",
		title: "Integrity verification",
		technical: "Integrity · Tamper assessment",
		description: "Any protected artifact can be hashed and checked against its recorded reference. The answer is unambiguous: integrity verified, or tampering detected.",
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
		tag: "OPEN ACCESS",
		price: "$0",
		period: "Free Forever",
		description: "Essential cryptographic protection and tamper verification for individual digital artists and students.",
		features: [
			"Up to 10 artwork protections / month",
			"SHA-256 cryptographic fingerprinting",
			"Standard spatial watermark embedding",
			"Browser-based parity verification",
			"Local verification ledger persistence",
			"Standard PNG artifact export",
		],
		ctaText: "Start Protecting Free",
		ctaLink: "/protect",
	},
	{
		id: "creator",
		name: "Creator",
		tag: "PROFESSIONAL",
		price: "$29",
		period: "per month",
		description: "High-frequency perturbation hardening, on-chain provenance registration, and unlimited artifact generation.",
		features: [
			"Unlimited artwork protections",
			"Zero-loss frequency domain hardening",
			"Imperceptible latent-space watermarking",
			"On-chain certificate of authenticity issuance",
			"Immutable ownership registration",
			"High-resolution 4K/8K batch processing",
			"Permanent cryptographic audit reference",
		],
		highlighted: true,
		ctaText: "Launch Creator Suite",
		ctaLink: "/protect",
	},
	{
		id: "studio",
		name: "Studio",
		tag: "ENTERPRISE & INSTITUTIONS",
		price: "$149",
		period: "per month",
		description: "Comprehensive licensing management, dynamic usage rights, custom Hardhat nodes, and automated verification APIs.",
		features: [
			"Everything in Creator tier",
			"Granular smart-contract usage rights management",
			"Multi-party ownership transfers & delegations",
			"Automated webhook & REST API access",
			"Custom private ledger integration",
			"Priority ML-service pipeline queue",
			"Dedicated security SLA & onboarding",
		],
		ctaText: "Access Studio Suite",
		ctaLink: "/protect",
	},
];
