export type UserRole = "creator" | "studio" | "operator";

export interface User {
	name: string;
	email: string;
	role: UserRole;
	roleTitle: string;
	walletAddress?: string;
}

export const DEMO_PROFILES: Record<"creator" | "studio", User> = {
	creator: {
		name: "Elena Rostova",
		email: "elena.rostova@artshield.io",
		role: "creator",
		roleTitle: "Independent Digital Artist",
		walletAddress: "0x71C849A23E45BF0982",
	},
	studio: {
		name: "Veritas Contemporary",
		email: "curator@veritas.gallery",
		role: "studio",
		roleTitle: "Gallery & Studio Principal",
		walletAddress: "0x39F88B1A0029CDE841",
	},
};

export interface AuthContextType {
	user: User | null;
	isAuthenticated: boolean;
	authReady: boolean;
	login: (username: string, password: string) => Promise<void>;
	logout: () => Promise<void>;
}

