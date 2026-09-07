import { useEffect, useState, type ReactNode } from "react";
import { User, DEMO_PROFILES } from "../types/auth";
import { AuthContext } from "./authContextDef";

const STORAGE_KEY = "artshield.auth.session";

export function AuthProvider({ children }: { children: ReactNode }) {
	const [user, setUser] = useState<User | null>(() => {
		if (typeof window === "undefined") return null;
		try {
			const saved = localStorage.getItem(STORAGE_KEY);
			return saved ? (JSON.parse(saved) as User) : null;
		} catch {
			return null;
		}
	});

	useEffect(() => {
		if (typeof window === "undefined") return;
		try {
			if (user) {
				localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
			} else {
				localStorage.removeItem(STORAGE_KEY);
			}
		} catch {
			// Ignore local storage errors
		}
	}, [user]);

	const login = (newUser: User) => {
		setUser(newUser);
	};

	const loginDemo = (role: "creator" | "studio") => {
		setUser(DEMO_PROFILES[role]);
	};

	const logout = () => {
		setUser(null);
	};

	return (
		<AuthContext.Provider
			value={{
				user,
				isAuthenticated: Boolean(user),
				login,
				loginDemo,
				logout,
			}}
		>
			{children}
		</AuthContext.Provider>
	);
}

