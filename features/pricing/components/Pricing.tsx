import Navbar from '@/components/layout/Navbar';

const PLANS = [
  {
    name: 'Free',
    price: '$0',
    period: '/month',
    description: 'Perfect for individuals and small teams getting started.',
    features: ['5 Projects', '20 Tasks per project', '2 Team members', 'Basic Analytics'],
    cta: 'Get Started',
    href: '/register',
    highlighted: false,
  },
  {
    name: 'Pro',
    price: '$12',
    period: '/month per user',
    description: 'For growing teams that need more power and collaboration.',
    features: ['Unlimited Projects', 'Unlimited Tasks', 'Up to 20 Team members', 'AI Task Generation', 'Advanced Analytics', 'Sprint Management', 'Time Tracking'],
    cta: 'Start Free Trial',
    href: '/register',
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    description: 'For large organizations with advanced security and compliance needs.',
    features: ['Everything in Pro', 'SSO / SAML', 'Audit Logs', 'Dedicated Support', 'Custom Integrations', 'SLA Guarantee'],
    cta: 'Contact Sales',
    href: 'mailto:sales@taskflowpro.com',
    highlighted: false,
  },
];

export default function Pricing() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar className="z-0" />
      <div className="py-6 sm:py-12 container mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Choose Your Plan</h1>
          <p className="text-sm sm:text-base text-gray-600">
            Select the perfect plan for your needs. Upgrade or downgrade at any time.
          </p>
        </div>
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-2xl p-8 flex flex-col ${plan.highlighted ? 'bg-indigo-600 text-white shadow-2xl scale-105' : 'bg-white shadow'}`}
            >
              <h2 className={`text-2xl font-bold mb-1 ${plan.highlighted ? 'text-white' : 'text-gray-900'}`}>{plan.name}</h2>
              <div className="flex items-end gap-1 mb-4">
                <span className={`text-4xl font-extrabold ${plan.highlighted ? 'text-white' : 'text-gray-900'}`}>{plan.price}</span>
                {plan.period && <span className={`text-sm mb-1 ${plan.highlighted ? 'text-indigo-200' : 'text-gray-500'}`}>{plan.period}</span>}
              </div>
              <p className={`text-sm mb-6 ${plan.highlighted ? 'text-indigo-200' : 'text-gray-500'}`}>{plan.description}</p>
              <ul className="flex-1 space-y-2 mb-8">
                {plan.features.map((f) => (
                  <li key={f} className={`flex items-center gap-2 text-sm ${plan.highlighted ? 'text-indigo-100' : 'text-gray-600'}`}>
                    <span>✓</span> {f}
                  </li>
                ))}
              </ul>
              <a
                href={plan.href}
                className={`text-center py-3 px-6 rounded-xl font-semibold transition ${plan.highlighted ? 'bg-white text-indigo-600 hover:bg-indigo-50' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
              >
                {plan.cta}
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
