import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | Hoodie Academy',
  description: 'Privacy Policy for Hoodie Academy - How we collect, use, and protect your information.',
};

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-4xl font-bold mb-8 text-center bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          Privacy Policy
        </h1>
        
        <div className="prose prose-invert max-w-none">
          <p className="text-gray-300 mb-8 text-center">
            Last updated: {new Date().toLocaleDateString()}
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-purple-400">1. Introduction</h2>
            <p className="text-gray-300 leading-relaxed">
              Hoodie Academy ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our educational platform.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-purple-400">2. Information We Collect</h2>
            
            <h3 className="text-xl font-medium mb-3 text-purple-300">2.1 Wallet Information</h3>
            <p className="text-gray-300 leading-relaxed mb-4">
              When you connect your cryptocurrency wallet to our Platform, we collect:
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4 mb-4">
              <li>Your wallet address (public key)</li>
              <li>Transaction signatures for authentication</li>
              <li>Wallet type and connection status</li>
            </ul>

            <h3 className="text-xl font-medium mb-3 text-purple-300">2.2 Profile Information</h3>
            <p className="text-gray-300 leading-relaxed mb-4">
              You may choose to provide:
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4 mb-4">
              <li>Display name and username</li>
              <li>Profile picture (including NFT profile pictures)</li>
              <li>Bio and other profile details</li>
              <li>Social media connections (Twitter/X)</li>
            </ul>

            <h3 className="text-xl font-medium mb-3 text-purple-300">2.3 Usage Information</h3>
            <p className="text-gray-300 leading-relaxed mb-4">
              We automatically collect:
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
              <li>Course progress and completion data</li>
              <li>Bounty submissions and completions</li>
              <li>XP and level progression</li>
              <li>Platform usage analytics</li>
              <li>Device and browser information</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-purple-400">3. How We Use Your Information</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              We use the collected information to:
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
              <li>Provide and maintain our educational services</li>
              <li>Authenticate your identity and secure your account</li>
              <li>Track your learning progress and achievements</li>
              <li>Process bounty rewards and XP distribution</li>
              <li>Improve our Platform and user experience</li>
              <li>Communicate with you about Platform updates</li>
              <li>Prevent fraud and ensure Platform security</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-purple-400">4. Information Sharing and Disclosure</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              We do not sell, trade, or rent your personal information. We may share information in the following circumstances:
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
              <li><strong>Public Information:</strong> Wallet addresses, usernames, and achievements may be publicly visible on leaderboards</li>
              <li><strong>Service Providers:</strong> With trusted third-party services that help us operate the Platform</li>
              <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
              <li><strong>Business Transfers:</strong> In connection with any merger, sale, or acquisition</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-purple-400">5. Blockchain and Cryptocurrency</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              Important considerations for blockchain interactions:
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
              <li>Blockchain transactions are public and immutable</li>
              <li>Your wallet address may be visible on public blockchains</li>
              <li>We cannot control or modify blockchain data</li>
              <li>Smart contract interactions are permanent</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-purple-400">6. Data Security</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              We implement appropriate security measures to protect your information:
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
              <li>Encryption of sensitive data in transit and at rest</li>
              <li>Regular security audits and updates</li>
              <li>Access controls and authentication requirements</li>
              <li>Secure database and server infrastructure</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-purple-400">7. Your Rights and Choices</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              You have the right to:
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
              <li>Access and update your profile information</li>
              <li>Disconnect your wallet from the Platform</li>
              <li>Request deletion of your account data</li>
              <li>Opt out of non-essential communications</li>
              <li>Control your privacy settings</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-purple-400">8. Cookies and Tracking</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              We use cookies and similar technologies to:
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
              <li>Remember your preferences and settings</li>
              <li>Analyze Platform usage and performance</li>
              <li>Provide personalized content</li>
              <li>Ensure Platform security</li>
            </ul>
            <p className="text-gray-300 leading-relaxed mt-4">
              You can control cookie settings through your browser preferences.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-purple-400">9. Third-Party Services</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              Our Platform may integrate with third-party services:
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
              <li>Wallet providers (Phantom, MetaMask, etc.)</li>
              <li>Social media platforms (Twitter/X)</li>
              <li>Analytics and monitoring services</li>
              <li>Educational content providers</li>
            </ul>
            <p className="text-gray-300 leading-relaxed mt-4">
              These services have their own privacy policies, which we encourage you to review.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-purple-400">10. Children's Privacy</h2>
            <p className="text-gray-300 leading-relaxed">
              Our Platform is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If you are a parent or guardian and believe your child has provided us with personal information, please contact us.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-purple-400">11. International Users</h2>
            <p className="text-gray-300 leading-relaxed">
              If you are accessing our Platform from outside the United States, please be aware that your information may be transferred to, stored, and processed in the United States where our servers are located.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-purple-400">12. Changes to This Privacy Policy</h2>
            <p className="text-gray-300 leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-purple-400">13. Contact Us</h2>
            <p className="text-gray-300 leading-relaxed">
              If you have any questions about this Privacy Policy or our privacy practices, please contact us through our official channels on the Platform.
            </p>
          </section>
        </div>

        <div className="mt-12 text-center">
          <a 
            href="/" 
            className="inline-flex items-center px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors"
          >
            ← Back to Hoodie Academy
          </a>
        </div>
      </div>
    </div>
  );
}
