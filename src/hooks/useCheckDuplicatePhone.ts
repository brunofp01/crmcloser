import { supabase } from '@/integrations/supabase/client';

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length <= 10) return digits;
  // 11+ digits: DDD (2 first) + last 8
  return digits.slice(0, 2) + digits.slice(-8);
}

export async function checkDuplicatePhone(phone: string): Promise<{ exists: boolean; clientName?: string }> {
  const normalized = normalizePhone(phone);
  if (!normalized || normalized.length < 10) return { exists: false };

  const { data, error } = await supabase
    .from('clients')
    .select('id, name, phone')
    .order('created_at', { ascending: false });

  if (error || !data) return { exists: false };

  const match = data.find(c => normalizePhone(c.phone) === normalized);
  return match ? { exists: true, clientName: match.name } : { exists: false };
}
