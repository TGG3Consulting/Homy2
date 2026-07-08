import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import { I18nProvider } from '@/lib/i18n';
import Home from '@/pages/Home';
import Results from '@/pages/Results';
import ScheduleViewing from '@/pages/ScheduleViewing';
import HowItWorks from '@/pages/HowItWorks';
import ForBuyers from '@/pages/ForBuyers';
import ForRenters from '@/pages/ForRenters';
import ForOwners from '@/pages/ForOwners';
import ListProperty from '@/pages/ListProperty';
import AboutUs from '@/pages/AboutUs';
// Add page imports here

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/results" element={<Results />} />
      <Route path="/schedule" element={<ScheduleViewing />} />
      <Route path="/how-it-works" element={<HowItWorks />} />
      <Route path="/for-buyers" element={<ForBuyers />} />
      <Route path="/for-renters" element={<ForRenters />} />
      <Route path="/for-owners" element={<ForOwners />} />
      <Route path="/list-property" element={<ListProperty />} />
      <Route path="/about-us" element={<AboutUs />} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <I18nProvider>
      <AuthProvider>
        <QueryClientProvider client={queryClientInstance}>
          <Router>
            <ScrollToTop />
            <AuthenticatedApp />
          </Router>
          <Toaster />
        </QueryClientProvider>
      </AuthProvider>
    </I18nProvider>
  )
}

export default App