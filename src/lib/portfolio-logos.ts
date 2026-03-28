// Maps portfolio ID to its logo path in /public/logos/
export const PORTFOLIO_LOGOS: Record<number, string> = {
  1: "/logos/S Invest 1.png",
  2: "/logos/S Invest 3.png",
  3: "/logos/S Invest 4.png",
};

export function getPortfolioLogo(portfolioId: number): string | null {
  return PORTFOLIO_LOGOS[portfolioId] ?? null;
}
