import { ReactNode } from 'react';
import { ModeSwitch } from '@/shared/ui/ModeSwitch';
import { Button } from '@/shared/ui/Button';
import { Link } from 'react-router-dom';

interface SimpleShellProps {
	title: string;
	description?: string;
	children: ReactNode;
}

export const SimpleShell = ({ title, description, children }: SimpleShellProps) => {
	return (
		<div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 flex flex-col safe-area-top safe-area-bottom pb-24">
			<div className="app-shell w-full max-w-4xl space-y-6 py-6">
				<div className="flex flex-col gap-3 rounded-3xl bg-white/90 p-5 shadow-sm">
					<ModeSwitch />
					<div>
						<h1 className="text-3xl md:text-4xl font-bold">{title}</h1>
						{description && <p className="text-lg text-muted-foreground mt-1">{description}</p>}
					</div>
				</div>

				{children}
			</div>

			<div className="no-print fixed inset-x-0 bottom-0 z-40 bg-white/90 backdrop-blur border-t border-border/70 safe-area-bottom">
				<div className="app-shell max-w-4xl mx-auto py-3 grid grid-cols-3 gap-2 text-sm font-semibold">
					<Button variant="ghost" size="xl" asChild className="flex flex-col gap-1 h-auto py-3">
						<Link to="/dashboard">
							<span>Главная</span>
							<span className="text-muted-foreground text-xs">льготы</span>
						</Link>
					</Button>
					<Button variant="accent" size="xl" asChild className="flex flex-col gap-1 h-auto py-3">
						<Link to="/assistant">
							<span>Ассистент</span>
							<span className="text-muted-foreground text-xs text-accent-foreground/90">вопрос</span>
						</Link>
					</Button>
					<Button variant="outline" size="xl" asChild className="flex flex-col gap-1 h-auto py-3">
						<Link to="/print">
							<span>Печать</span>
							<span className="text-muted-foreground text-xs">памятка</span>
						</Link>
					</Button>
				</div>
			</div>
		</div>
	);
};

export default SimpleShell;
