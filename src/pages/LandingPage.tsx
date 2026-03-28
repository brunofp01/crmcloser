import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import logo from '@/assets/closer-logo.png';
import dashboardImg from '@/assets/landing/crm-dashboard.png';
import mobileImg from '@/assets/landing/crm-mobile-v3.png';
import propertyImg from '@/assets/landing/crm-property.png';
import { LandingNav } from '@/components/landing/LandingNav';
import { LandingHero } from '@/components/landing/LandingHero';
import { LandingSocialProof } from '@/components/landing/LandingSocialProof';
import { LandingPainPoints } from '@/components/landing/LandingPainPoints';
import { LandingFeatures } from '@/components/landing/LandingFeatures';
import { LandingShowcase } from '@/components/landing/LandingShowcase';
import { LandingHowItWorks } from '@/components/landing/LandingHowItWorks';
import { LandingTestimonials } from '@/components/landing/LandingTestimonials';
import { LandingPricing } from '@/components/landing/LandingPricing';
import { LandingFAQ } from '@/components/landing/LandingFAQ';
import { LandingFinalCTA } from '@/components/landing/LandingFinalCTA';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { LandingWhatsApp } from '@/components/landing/LandingWhatsApp';

export default function LandingPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, loading, navigate]);

  const handleLogin = () => {
    navigate('/dashboard');
  };

  const handleSubscribe = () => {
    navigate('/register-subscription');
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white overflow-x-hidden">
      <LandingNav logo={logo} onLogin={handleLogin} onSubscribe={handleSubscribe} />
      <LandingHero
        logo={logo}
        dashboardImg={dashboardImg}
        mobileImg={mobileImg}
        onSubscribe={handleSubscribe}
      />
      <LandingSocialProof />
      <LandingPainPoints />
      <LandingFeatures />
      <LandingShowcase
        dashboardImg={dashboardImg}
        propertyImg={propertyImg}
        mobileImg={mobileImg}
      />
      <LandingHowItWorks />
      <LandingTestimonials />
      <LandingPricing onSubscribe={handleSubscribe} />
      <LandingFAQ />
      <LandingFinalCTA onSubscribe={handleSubscribe} />
      <LandingFooter logo={logo} />
      <LandingWhatsApp />
    </div>
  );
}
