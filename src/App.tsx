import { Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { BeneficiariesPage } from './pages/BeneficiariesPage';
import { ActionPlanPage } from './pages/ActionPlanPage';
import { CompanyResearchPage } from './pages/CompanyResearchPage';
import { CrossMarketPage } from './pages/CrossMarketPage';
import { DashboardPage } from './pages/DashboardPage';
import { IdeaPipelinePage } from './pages/IdeaPipelinePage';
import { MarketRadarPage } from './pages/MarketRadarPage';
import { NewsPage } from './pages/NewsPage';
import { SupplyChainPage } from './pages/SupplyChainPage';
import { ThemesPage } from './pages/ThemesPage';
import { WatchlistPage } from './pages/WatchlistPage';
import { TaiwanMarketPage, USMarketPage } from './components/MarketSectionView';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/us-market" element={<USMarketPage />} />
        <Route path="/taiwan-market" element={<TaiwanMarketPage />} />
        <Route path="/cross-market" element={<CrossMarketPage />} />
        <Route path="/market-radar" element={<MarketRadarPage />} />
        <Route path="/news" element={<NewsPage />} />
        <Route path="/themes" element={<ThemesPage />} />
        <Route path="/supply-chain" element={<SupplyChainPage />} />
        <Route path="/beneficiaries" element={<BeneficiariesPage />} />
        <Route path="/company-research" element={<CompanyResearchPage />} />
        <Route path="/watchlist" element={<WatchlistPage />} />
        <Route path="/idea-pipeline" element={<IdeaPipelinePage />} />
        <Route path="/action-plan" element={<ActionPlanPage />} />
      </Routes>
    </Layout>
  );
}
