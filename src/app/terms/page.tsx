import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service | Hoodie Academy',
  description: 'Terms of Service for Hoodie Academy - Learn blockchain development and earn rewards.',
};

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-4xl font-bold mb-8 text-center bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          Terms of Service
        </h1>
        
        <div className="prose prose-invert max-w-none">
          <p className="text-gray-300 mb-8 text-center">
            Last updated: {new Date().toLocaleDateString()}
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-purple-400">1. Acceptance of Terms</h2>
            <p className="text-gray-300 leading-relaxed">
              By accessing and using Hoodie Academy ("the Platform"), you accept and agree to be bound by the terms and provision of this agreement. 
              If you do not agree to abide by the above, please do not use this service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-purple-400">2. Description of Service</h2>
            <p className="text-gray-300 leading-relaxed">
              Hoodie Academy is an educational platform focused on blockchain development, cryptocurrency, and Web3 technologies. 
              We provide courses, bounties, mentorship sessions, and community features to help users learn and grow in the blockchain space.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-purple-400">3. User Accounts and Wallet Connection</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              To access certain features of the Platform, you may be required to connect a cryptocurrency wallet. You are responsible for:
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
              <li>Maintaining the security of your wallet and private keys</li>
              <li>All activities that occur under your account</li>
              <li>Ensuring your wallet connection is secure</li>
              <li>Complying with all applicable laws and regulations</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-purple-400">4. Educational Content and Courses</h2>
            <p className="text-gray-300 leading-relaxed">
              All educational content provided on the Platform is for informational purposes only. 
              While we strive for accuracy, we make no guarantees about the completeness, reliability, or accuracy of the information provided.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-purple-400">5. Bounties and Rewards</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              The Platform may offer bounties and rewards for completing certain tasks or challenges. By participating:
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
              <li>You agree to complete tasks honestly and to the best of your ability</li>
              <li>Rewards are subject to verification and approval</li>
              <li>We reserve the right to modify or cancel bounties at any time</li>
              <li>Rewards may be subject to applicable taxes</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-purple-400">6. Community Guidelines</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              Users must adhere to our community guidelines:
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
              <li>Be respectful and professional in all interactions</li>
              <li>No harassment, discrimination, or offensive behavior</li>
              <li>No spam, scams, or fraudulent activities</li>
              <li>Respect intellectual property rights</li>
              <li>Follow all applicable laws and regulations</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-purple-400">7. Intellectual Property</h2>
            <p className="text-gray-300 leading-relaxed">
              The Platform and its original content, features, and functionality are owned by Hoodie Academy and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-purple-400">8. Disclaimer of Warranties</h2>
            <p className="text-gray-300 leading-relaxed">
              The Platform is provided on an "AS IS" and "AS AVAILABLE" basis. We make no representations or warranties of any kind, express or implied, as to the operation of the Platform or the information, content, materials, or products included on the Platform.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-purple-400">9. Limitation of Liability</h2>
            <p className="text-gray-300 leading-relaxed">
              In no event shall Hoodie Academy be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-purple-400">10. Changes to Terms</h2>
            <p className="text-gray-300 leading-relaxed">
              We reserve the right to modify or replace these Terms at any time. If a revision is material, we will try to provide at least 30 days notice prior to any new terms taking effect.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-purple-400">11. Contact Information</h2>
            <p className="text-gray-300 leading-relaxed">
              If you have any questions about these Terms of Service, please contact us through our official channels on the Platform.
            </p>
          </section>
        </div>

        <div className="mt-12 text-center">
          <a 
            href="/" 
            className="inline-flex items-center px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors mb-8"
          >
            ← Back to Hoodie Academy
          </a>
        </div>

        {/* Footer Links */}
        <div className="mt-8 pt-8 border-t border-gray-700">
          <div className="flex flex-wrap justify-center gap-6 text-sm">
            <a 
              href="/privacy" 
              className="text-purple-400 hover:text-purple-300 transition-colors"
            >
              Privacy Policy
            </a>
            <span className="text-gray-500">•</span>
            <a 
              href="/terms" 
              className="text-purple-400 hover:text-purple-300 transition-colors"
            >
              Terms of Service
            </a>
            <span className="text-gray-500">•</span>
            <a 
              href="/governance" 
              className="text-purple-400 hover:text-purple-300 transition-colors"
            >
              Governance
            </a>
            <span className="text-gray-500">•</span>
            <a 
              href="/courses" 
              className="text-purple-400 hover:text-purple-300 transition-colors"
            >
              Courses
            </a>
            <span className="text-gray-500">•</span>
            <a 
              href="/bounties" 
              className="text-purple-400 hover:text-purple-300 transition-colors"
            >
              Bounties
            </a>
            <span className="text-gray-500">•</span>
            <a 
              href="/preview" 
              className="text-purple-400 hover:text-purple-300 transition-colors"
            >
              Preview
            </a>
            <span className="text-gray-500">•</span>
            <a 
              href="/faq" 
              className="text-purple-400 hover:text-purple-300 transition-colors"
            >
              FAQ
            </a>
          </div>
          <div className="text-center mt-4 text-gray-500 text-sm">
            © {new Date().getFullYear()} Hoodie Academy. All rights reserved.
          </div>
        </div>
      </div>
    </div>
  );
}
