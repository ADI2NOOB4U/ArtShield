import { useEffect } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";
import Protect from "./pages/Protect";
import Pricing from "./pages/Pricing";
import { AuthProvider } from "./context/AuthContext";
import { ROUTES } from "./utils/constants";

/** Scrolls to the top on route change, or to the hash target when one is present. */
function ScrollManager() {
	const { pathname, hash } = useLocation();
	useEffect(() => {
		if (hash) {
			const target = document.getElementById(hash.slice(1));
			if (target) {
				target.scrollIntoView();
				target.scrollIntoView({ behavior: "smooth" });
				return;
			}
		}
		window.scrollTo(0, 0);
	}, [pathname, hash]);
	return null;
}

export default function App() {
	return (
		<>
		<AuthProvider>
			<ScrollManager />
			<Routes>
				<Route path={ROUTES.home} element={<Home />} />
				<Route path={ROUTES.protect} element={<Protect />} />
				<Route path={ROUTES.pricing} element={<Pricing />} />
				<Route path="*" element={<NotFound />} />
			</Routes>
		</>
		</AuthProvider>
	);
}
