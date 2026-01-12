import { motion } from 'framer-motion';
import { 
  Shield, 
  Zap, 
  FileCheck, 
  Lock, 
  Globe,
  Fingerprint
} from 'lucide-react';

const FeaturesSection = () => {
  const features = [
    {
      icon: Shield,
      title: 'Tamper-Proof Records',
      description: 'Credentials stored on blockchain cannot be altered or forged. Every certificate has cryptographic proof of authenticity.',
    },
    {
      icon: Zap,
      title: 'Instant Verification',
      description: 'Verify any credential in seconds. No phone calls, no emails, no waiting. Just enter the token ID and get instant results.',
    },
    {
      icon: FileCheck,
      title: 'NFT Certificates',
      description: 'Each credential is minted as an ERC-721 NFT, giving students true ownership of their academic achievements.',
    },
    {
      icon: Fingerprint,
      title: 'Wallet-Based Identity',
      description: 'No passwords to remember. Your crypto wallet serves as your secure, decentralized identity for all interactions.',
    },
    {
      icon: Lock,
      title: 'Privacy First',
      description: 'Students control who sees their credentials. Share only what you want, when you want, with who you want.',
    },
    {
      icon: Globe,
      title: 'Global Recognition',
      description: 'Credentials are universally verifiable. Any employer, anywhere in the world, can verify in seconds.',
    },
  ];

  return (
    <section id="features" className="py-24 relative overflow-hidden">
      {/* Background glow */}
      <div className="glow-orb w-96 h-96 top-1/4 -right-48 opacity-20" />
      
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
            Features
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
            Why Choose <span className="gradient-text">EduVerify</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            The most secure and efficient way to issue and verify academic credentials
          </p>
        </motion.div>

        {/* Features grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="feature-card group"
            >
              <div className="relative">
                <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <div className="absolute inset-0 w-12 h-12 rounded-xl bg-gradient-primary opacity-40 blur-xl group-hover:opacity-60 transition-opacity" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
