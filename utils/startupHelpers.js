import User from '../models/User.js';

export async function attachFounderNames(startups) {
  const list = Array.isArray(startups) ? startups : [startups];
  if (!list.length) return Array.isArray(startups) ? [] : null;

  const emails = [...new Set(list.map((s) => s.founder_email).filter(Boolean))];
  const users = await User.find({ email: { $in: emails } }).select('email name');
  const nameByEmail = Object.fromEntries(users.map((u) => [u.email, u.name]));

  const enriched = list.map((startup) => {
    const obj = startup.toObject ? startup.toObject() : { ...startup };
    obj.founder_name =
      nameByEmail[obj.founder_email] ||
      obj.founder_email?.split('@')[0] ||
      'Founder';
    return obj;
  });

  return Array.isArray(startups) ? enriched : enriched[0];
}
