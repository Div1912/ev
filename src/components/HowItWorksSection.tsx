import { motion } from 'framer-motion';
import { Building2, Upload, Shield, Share2 } from 'lucide-react';

const HowItWorksSection = () => {
  const steps = [
    {
      step: '01',
      icon: Building2,
      title: 'Institution Signs Up',
      description: 'Universities and institutions register on EduVerify and get verified as authorized credential issuers.',
    },
    {
      step: '02',
      icon: Upload,
      title: 'Issue Credentials',
      description: 'Issue academic credentials as NFTs on the blockchain. Each credential is unique and verifiable.',
    },
    {
      step: '03',
      icon: Shield,
      title: 'Student Receives',
      description: 'Students receive their credentials in their wallet. Full ownership and control of their achievements.',
    },
    {
      step: '04',
      icon: Share2,
      title: 'Share & Verify',
      description: 'Share credentials with employers. They verify instantly using the token ID. No intermediaries needed.',
    },
  ];

  return (
    <section id="how-it-works" className="py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full border border-white/10 bg-white/5 text-sm font-medium text-primary mb-4">
            How It Works
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
            Simple, Secure, <span className="gradient-text">Seamless</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            From issuance to verification in four easy steps
          </p>
        </motion.div>

        {/* Steps */}
        <div className="relative">
          {/* Connection line */}
          <div className="absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent hidden lg:block" />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.15 }}
                className="relative"
              >
                <div className="glass-card p-6 h-full group hover:-translate-y-2 transition-all duration-500">
                  {/* Step number */}
                  <div className="absolute -top-4 -left-2 text-6xl font-bold text-primary/10 group-hover:text-primary/20 transition-colors">
                    {step.step}
                  </div>
                  
                  {/* Icon */}
                  <div className="relative z-10 w-14 h-14 rounded-xl bg-gradient-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <step.icon className="w-7 h-7 text-white" />
                  </div>
                  
                  {/* Content */}
                  <h3 className="text-xl font-semibold mb-3 relative z-10">{step.title}</h3>
                  <p className="text-muted-foreground relative z-10">{step.description}</p>
                </div>

                {/* Arrow for desktop */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-4 w-8 h-8 text-primary/50 z-20">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="text-center mt-16"
        >
          <p className="text-lg text-muted-foreground mb-6">
            Ready to revolutionize credential verification?
          </p>
          <a href="/login" className="btn-primary inline-flex">
            Get Started Today
          </a>
        </motion.div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
