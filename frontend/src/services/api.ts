const configuredApiUrl = import.meta.env.VITE_API_URL ?? "";

export const apiBaseUrl = configuredApiUrl.replace(/\/api\/?$/, "").replace(/\/+$/, "");

export function apiUrl(path: string): string {
	return `${apiBaseUrl}/${path.replace(/^\/+/, "")}`;
}

export const apiRequestDefaults: RequestInit = { credentials: "include" };
