import { Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { BeneficiariesPage } from './pages/BeneficiariesPage';
import { CompanyResearchPage } from './pages/CompanyResearchPage';
import { DashboardPage } from './pages/DashboardPage';
import { IdeaPipelinePage } from './pages/IdeaPipelinePage';
import { NewsPage } from './pages/NewsPage';
import { SupplyChainPage } from './pages/SupplyChainPage';
import { ThemesPage } from './pages/ThemesPage';
import { WatchlistPage } from './pages/WatchlistPage';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/news" element={<NewsPage />} />
        <Route path="/themes" element={<ThemesPage />} />
        <Route path="/supply-chain" element={<SupplyChainPage />} />
        <Route path="/beneficiaries" element={<BeneficiariesPage />} />
        <Route path="/company-research" element={<CompanyResearchPage />} />
        <Route path="/watchlist" element={<WatchlistPage />} />
        <Route path="/idea-pipeline" element={<IdeaPipelinePage />} />
      </Routes>
    </Layout>
  );
}
