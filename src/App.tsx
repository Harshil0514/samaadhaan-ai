import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { AuthModal } from './components/AuthModal';
import { LandingPage } from './pages/LandingPage';
import { ExploreChallengesPage } from './pages/ExploreChallengesPage';
import { ReportProblemPage } from './pages/ReportProblemPage';
import { ProblemDetailPage } from './pages/ProblemDetailPage';
import { CitizenDashboard } from './pages/CitizenDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { InstitutionDashboard } from './pages/InstitutionDashboard';
import { ExpertDashboard } from './pages/ExpertDashboard';
import { ProjectsPage } from './pages/ProjectsPage';
import { FullMapPage } from './pages/FullMapPage';
import { ImpactDashboard } from './pages/ImpactDashboard';
import { ContactPage } from './pages/ContactPage';
import { Problem } from './types';

function MainApp() {
  const { role } = useAuth();
  const [currentPage, setCurrentPage] = useState<string>('landing');
  const [selectedProblemId, setSelectedProblemId] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const handleNavigate = (page: string) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectProblem = (problem: Problem) => {
    setSelectedProblemId(problem.id);
    setCurrentPage('problem_detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectProject = (projectId: string) => {
    setSelectedProjectId(projectId);
    setCurrentPage('projects');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
      {/* Navigation Header */}
      <Navbar
        currentTab={currentPage}
        setCurrentTab={handleNavigate}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onOpenReport={() => handleNavigate('report')}
      />

      {/* Main Content Router */}
      <main className="flex-1">
        {currentPage === 'landing' && (
          <LandingPage
            onOpenReport={() => handleNavigate('report')}
            onSelectProblem={handleSelectProblem}
            setCurrentTab={handleNavigate}
          />
        )}

        {currentPage === 'explore' && (
          <ExploreChallengesPage
            onSelectProblem={handleSelectProblem}
            onOpenReport={() => handleNavigate('report')}
          />
        )}

        {currentPage === 'report' && (
          <ReportProblemPage
            onSuccess={(newProblem) => handleSelectProblem(newProblem)}
            onCancel={() => handleNavigate('explore')}
          />
        )}

        {currentPage === 'problem_detail' && selectedProblemId && (
          <ProblemDetailPage
            problemId={selectedProblemId}
            onBack={() => handleNavigate('explore')}
            onSelectProject={handleSelectProject}
          />
        )}

        {(currentPage === 'citizen' || currentPage === 'citizen_dashboard') && (
          <CitizenDashboard
            onOpenReport={() => handleNavigate('report')}
            onSelectProblem={handleSelectProblem}
          />
        )}

        {(currentPage === 'admin' || currentPage === 'admin_dashboard') && (
          <AdminDashboard
            onSelectProblem={handleSelectProblem}
            onSelectProject={handleSelectProject}
          />
        )}

        {(currentPage === 'institution' || currentPage === 'institution_dashboard') && (
          <InstitutionDashboard
            onSelectProblem={handleSelectProblem}
            onSelectProject={handleSelectProject}
          />
        )}

        {(currentPage === 'expert' || currentPage === 'expert_dashboard') && (
          <ExpertDashboard
            onSelectProblem={handleSelectProblem}
            onSelectProject={handleSelectProject}
          />
        )}

        {currentPage === 'projects' && (
          <ProjectsPage
            selectedProjectId={selectedProjectId}
            onBack={() => setSelectedProjectId(null)}
          />
        )}

        {currentPage === 'map' && (
          <FullMapPage
            onSelectProblem={handleSelectProblem}
            onOpenReport={() => handleNavigate('report')}
          />
        )}

        {currentPage === 'impact' && (
          <ImpactDashboard />
        )}

        {currentPage === 'contact' && (
          <ContactPage
            onOpenReport={() => handleNavigate('report')}
            setCurrentTab={handleNavigate}
          />
        )}
      </main>

      {/* Footer */}
      <Footer setCurrentTab={handleNavigate} />

      {/* Authentication & Role Switcher Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
