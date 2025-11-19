import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthPage } from "./features/auth/AuthPage";
import { ProfilePage } from "./features/profile/ProfilePage";
import { BenefitsListPage } from "./features/benefits/BenefitsListPage";
import { BenefitDetailsPage } from "./features/benefits/BenefitDetailsPage";
import { LifeFeedPage } from "./features/life-feed/LifeFeedPage";
import { AptekaPage } from "./features/apteka/AptekaPage";
import { SimpleModePage } from "./features/simple-mode/SimpleModePage";
import { PrintView } from "./features/print/PrintView";
import NotFound from "./pages/NotFound";
import { ProtectedRoute } from "./shared/router/ProtectedRoute";
import { AuthProvider, useAuth } from "./features/auth/AuthContext";

const queryClient = new QueryClient();

const AuthEntryRoute = () => {
	const { user } = useAuth();
	return user ? <Navigate to="/dashboard" replace /> : <AuthPage />;
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

								<Route path="*" element={<NotFound />} />
							</Routes>
						</HashRouter>
					</TooltipProvider>
				</AuthProvider>
			</QueryClientProvider>
	);
};

export default App;
