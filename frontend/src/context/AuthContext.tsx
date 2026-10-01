import { useEffect, useState, type ReactNode } from "react";
import { apiRequestDefaults, apiUrl } from "../services/api";
import { User } from "../types/auth";
import { AuthContext } from "./authContextDef";

export function AuthProvider({ children }: { children: ReactNode }) {
	const [user, setUser] = useState<User | null>(null);
	const [authReady, setAuthReady] = useState(false);

	useEffect(() => {
		fetch(apiUrl("/api/auth/session"), apiRequestDefaults)
			.then(async (response) => (response.ok ? (response.json() as Promise<{ user: User }>) : null))
			.then((session) => setUser(session?.user ?? null))
			.catch(() => setUser(null))
			.finally(() => setAuthReady(true));
	}, []);

	const login = async (username: string, password: string) => {
		const response = await fetch(apiUrl("/api/auth/login"), {
			...apiRequestDefaults,
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ username, password }),
		});
		const body = (await response.json().catch(() => null)) as { error?: string } | null;
		if (!response.ok) throw new Error(body?.error ?? "Authentication failed");

		const sessionResponse = await fetch(apiUrl("/api/auth/session"), apiRequestDefaults);
		const session = (await sessionResponse.json().catch(() => null)) as { user?: User; error?: string } | null;
		if (!sessionResponse.ok || !session?.user) {
			throw new Error(session?.error ?? "Login succeeded, but the authenticated session could not be established");
		}
		setUser(session.user);
	};

	const logout = async () => {
		await fetch(apiUrl("/api/auth/logout"), { ...apiRequestDefaults, method: "POST" }).catch(() => undefined);
		setUser(null);
	};

	return (
		<AuthContext.Provider
			value={{
				user,
				isAuthenticated: Boolean(user),
				authReady,
				login,
				logout,
			}}
		>
			{children}
		</AuthContext.Provider>
	);
}

