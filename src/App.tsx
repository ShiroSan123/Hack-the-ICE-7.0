import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import NotFound from "./pages/NotFound";
import { ProtectedRoute } from "./shared/router/ProtectedRoute";
import { AuthProvider, useAuth } from "./features/auth/AuthContext";
import { Button } from "./shared/ui/Button";
import { supabase } from "./shared/lib/supabaseClient";
import { useAppStore } from "./shared/store/useAppStore";

const AuthPage = lazy(() => import("./features/auth/AuthPage").then((mod) => ({ default: mod.AuthPage })));
const ProfilePage = lazy(() => import("./features/profile/ProfilePage").then((mod) => ({ default: mod.ProfilePage })));
const BenefitsListPage = lazy(() => import("./features/benefits/BenefitsListPage").then((mod) => ({ default: mod.BenefitsListPage })));
const BenefitDetailsPage = lazy(() => import("./features/benefits/BenefitDetailsPage").then((mod) => ({ default: mod.BenefitDetailsPage })));
const LifeFeedPage = lazy(() => import("./features/life-feed/LifeFeedPage").then((mod) => ({ default: mod.LifeFeedPage })));
const AptekaPage = lazy(() => import("./features/apteka/AptekaPage").then((mod) => ({ default: mod.AptekaPage })));
const SimpleModePage = lazy(() => import("./features/simple-mode/SimpleModePage").then((mod) => ({ default: mod.SimpleModePage })));
const PrintView = lazy(() => import("./features/print/PrintView").then((mod) => ({ default: mod.PrintView })));
const ChatBotPage = lazy(() => import("./features/chat/ChatBotPage").then((mod) => ({ default: mod.ChatBotPage })));

const queryClient = new QueryClient();

const AuthEntryRoute = () => {
	const { user, loading, profileSyncing, profileError, refreshProfile, setManualUser } = useAuth();
	const logoutStore = useAppStore((state) => state.logout);

	const handleResetAuth = async () => {
		try {
			await supabase.auth.signOut();
		} catch (error) {
			console.error('Auth reset error:', error);
		} finally {
			setManualUser(null);
			logoutStore();
		}
	};

	if (loading || profileSyncing) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-background">
				<div className="flex flex-col items-center gap-4 text-center">
					<Loader2 className="w-10 h-10 animate-spin text-primary" />
					<p className="text-lg font-medium">Загружаем профиль...</p>
				</div>
			</div>
		);
	}

	if (user) {
		if (profileError) {
			return (
				<div className="min-h-screen flex items-center justify-center bg-background p-4">
					<div className="max-w-md w-full rounded-3xl border border-border bg-white p-6 text-center space-y-4">
						<h2 className="text-2xl font-semibold">Не удалось загрузить профиль</h2>
						<p className="text-muted-foreground">{profileError}</p>
						<div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
							<Button
								size="lg"
								className="flex-1"
								onClick={() => {
									refreshProfile().catch(() => undefined);
								}}
							>
								Попробовать снова
							</Button>
							<Button
								variant="outline"
								size="lg"
								className="flex-1"
								onClick={handleResetAuth}
							>
								Сменить аккаунт
							</Button>
						</div>
					</div>
				</div>
			);
		}

		return <Navigate to="/dashboard" replace />;
	}

	return <AuthPage />;
};

const RootRoute = () => {
	const { user } = useAuth();
	return <Navigate to={user ? "/dashboard" : "/auth"} replace />;
};

const App = () => {
	return (
		<QueryClientProvider client={queryClient}>
			<AuthProvider>
				<TooltipProvider>
					<Toaster />
					<Sonner />
					<Suspense
						fallback={
							<div className="min-h-screen flex items-center justify-center bg-background">
								<div className="flex flex-col items-center gap-4 text-center">
									<Loader2 className="w-10 h-10 animate-spin text-primary" />
									<p className="text-lg font-medium">Загружаем интерфейс...</p>
								</div>
							</div>
						}
					>
						<HashRouter>
							<Routes>
								<Route path="/auth" element={<AuthEntryRoute />} />
								<Route path="/" element={<RootRoute />} />

								<Route path="/dashboard" element={
									<ProtectedRoute>
										<LifeFeedPage />
									</ProtectedRoute>
								} />

								<Route path="/profile" element={
									<ProtectedRoute>
										<ProfilePage />
									</ProtectedRoute>
								} />

								<Route path="/benefits" element={
									<ProtectedRoute>
										<BenefitsListPage />
									</ProtectedRoute>
								} />

								<Route path="/benefits/:id" element={
									<ProtectedRoute>
										<BenefitDetailsPage />
									</ProtectedRoute>
								} />

								<Route path="/apteka" element={
									<ProtectedRoute>
										<AptekaPage />
									</ProtectedRoute>
								} />

								<Route path="/simple" element={
									<ProtectedRoute>
										<SimpleModePage />
									</ProtectedRoute>
								} />

								<Route path="/print" element={
									<ProtectedRoute>
										<PrintView />
									</ProtectedRoute>
								} />

								<Route path="/assistant" element={
									<ProtectedRoute>
										<ChatBotPage />
									</ProtectedRoute>
								} />

								<Route path="*" element={<NotFound />} />
							</Routes>
						</HashRouter>
					</Suspense>
					</TooltipProvider>
				</AuthProvider>
			</QueryClientProvider>
	);
};

export default App;
