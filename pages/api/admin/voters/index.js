import { supabase, supabaseAdmin } from '../../../../lib/supabaseClient';
import { withAdminAuth } from '../../../../lib/withAdminAuth';

async function handler(req, res) {
  if (!req.admin) {
    return res.status(401).json({ message: 'Akses ditolak. Hanya admin yang diizinkan.' });
  }

  if (req.method === 'GET') {
    try {
      const { page = 1, limit = 15, search = '', program = '', status = '' } = req.query;
      const pageInt = parseInt(page, 10);
      const limitInt = parseInt(limit, 10);
      const offset = (pageInt - 1) * limitInt;

      let query = supabaseAdmin
        .from('users')
        .select('nim, email, program_code, already_vote, last_login, created_at, allowed_programs(program_name)', { count: 'exact' });

      if (search) {
        query = query.or(`nim.ilike.%${search}%,email.ilike.%${search}%`);
      }

      if (program) {
        query = query.eq('program_code', program);
      }

      if (status === 'voted') {
        query = query.eq('already_vote', true);
      } else if (status === 'not_voted') {
        query = query.eq('already_vote', false);
      }
      
      query = query.order('created_at', { ascending: false }).range(offset, offset + limitInt - 1);

      const { data, error, count } = await query;

      if (error) throw error;

      return res.status(200).json({
        voters: data,
        totalVoters: count,
        currentPage: pageInt,
        totalPages: Math.ceil(count / limitInt),
      });

    } catch (error) {
      return res.status(500).json({ message: 'Gagal mengambil data pemilih.' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

export default withAdminAuth(handler);
