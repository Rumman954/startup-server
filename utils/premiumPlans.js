export const FREE_OPPORTUNITY_LIMIT = 3;

export const PLAN_ORDER = ['plus', 'pro', 'pro_plus'];

export const PREMIUM_PLANS = {
  plus: {
    id: 'plus',
    name: 'Plus',
    tagline: 'Some limits, solid start',
    opportunityLimit: 10,
    features: [
      'Up to 10 opportunity postings',
      'Standard search listing',
      'Basic applicant tracking',
      'Email notifications',
    ],
    pricing: { monthly: 9.99, yearly: 99.99 },
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    tagline: 'Less limits, more growth',
    opportunityLimit: 25,
    popular: true,
    features: [
      'Up to 25 opportunity postings',
      'Priority search listing',
      'Premium startup badge',
      'Analytics dashboard',
      'Advanced applicant filtering',
    ],
    pricing: { monthly: 19.99, yearly: 199.99 },
  },
  pro_plus: {
    id: 'pro_plus',
    name: 'Pro+',
    tagline: 'No limits, full power',
    opportunityLimit: null,
    features: [
      'Unlimited opportunity postings',
      'Top priority listing',
      'Premium startup badge',
      'Full analytics dashboard',
      'Advanced filtering & sorting',
      'Priority notifications',
    ],
    pricing: { monthly: 29.99, yearly: 299.99 },
  },
};

export const getPlanPrice = (planId, billing = 'monthly') => {
  const plan = PREMIUM_PLANS[planId];
  if (!plan) return null;
  return billing === 'yearly' ? plan.pricing.yearly : plan.pricing.monthly;
};

export const getPlanRank = (planId) => {
  if (!planId) return -1;
  return PLAN_ORDER.indexOf(planId);
};

export const getOpportunityLimit = (user) => {
  const plan = PREMIUM_PLANS[user?.premiumPlan];
  if (plan?.opportunityLimit == null && user?.premiumPlan === 'pro_plus') return Infinity;
  if (plan?.opportunityLimit) return plan.opportunityLimit;
  if (user?.isPremium && !user?.premiumPlan) return Infinity;
  return FREE_OPPORTUNITY_LIMIT;
};

export const formatPlanLabel = (planId) => PREMIUM_PLANS[planId]?.name || 'Free';

export const getPlanProductName = (planId, billing) => {
  const plan = PREMIUM_PLANS[planId];
  if (!plan) return 'StartUp Labs Premium';
  const cycle = billing === 'yearly' ? 'Yearly' : 'Monthly';
  return `StartUp Labs ${plan.name} (${cycle})`;
};
