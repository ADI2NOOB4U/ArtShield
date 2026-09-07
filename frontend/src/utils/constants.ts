import type { ProtectionStage } from "../types/layer";

export const ROUTES = {
	home: "/",
	protect: "/protect",
} as const;

export const BRAND = {
	name: "ARTSHIELD",
	tagline: "PROTECT. PROVE. CONTROL.",
} as const;

export type NavLink = {
	label: string;
	href: string;
	placeholder?: boolean;
};

export const NAV_LINKS: NavLink[] = [
	{ label: "Protection", href: "/#protection" },
	{ label: "Verification", href: "/#verification" },
	{ label: "Technology", href: "/#technology" },
	{ label: "Provenance", href: "/#provenance" },
	{ label: "Pricing", href: "#", placeholder: true },
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
