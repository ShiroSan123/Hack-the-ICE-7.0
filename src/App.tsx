import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAppStore } from "./shared/store/useAppStore";
import { AuthPage } from "./features/auth/AuthPage";
import { ProfilePage } from "./features/profile/ProfilePage";
import { BenefitsListPage } from "./features/benefits/BenefitsListPage";
import { BenefitDetailsPage } from "./features/benefits/BenefitDetailsPage";
import { LifeFeedPage } from "./features/life-feed/LifeFeedPage";
import { AptekaPage } from "./features/apteka/AptekaPage";
import { SimpleModePage } from "./features/simple-mode/SimpleModePage";
import { PrintView } from "./features/print/PrintView";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
	const { user } = useAppStore();
	if (!user) return <Navigate to="/auth" replace />;
	return <>{children}</>;
};

const App = () => {
	const { user } = useAppStore();

	return (
		<QueryClientProvider client={queryClient}>
			<TooltipProvider>
				<Toaster />
				<Sonner />
				<BrowserRouter>
					<Routes>
						<Route path="/auth" element={user ? <Navigate to="/dashboard" replace /> : <AuthPage />} />
						<Route path="/" element={<Navigate to={user ? "/dashboard" : "/auth"} replace />} />

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
				</BrowserRouter>
			</TooltipProvider>
		</QueryClientProvider>
	);
};

export default App;
