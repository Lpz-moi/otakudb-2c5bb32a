import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!

    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Client avec les credentials de l'utilisateur pour vérifier les permissions
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    })

    // Vérifier l'utilisateur
    const token = authHeader.replace('Bearer ', '')
    const { data: claims, error: claimsError } = await userClient.auth.getClaims(token)
    
    if (claimsError || !claims?.claims) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const userId = claims.claims.sub as string

    // Vérifier si admin ou moderator
    const { data: roles } = await userClient
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)

    const isAdmin = roles?.some(r => r.role === 'admin')
    const isModerator = roles?.some(r => r.role === 'moderator' || r.role === 'admin')

    if (!isModerator) {
      return new Response(
        JSON.stringify({ error: 'Admin or moderator access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Client admin pour les opérations privilégiées
    const adminClient = createClient(supabaseUrl, supabaseServiceKey)

    const url = new URL(req.url)
    const pathParts = url.pathname.split('/').filter(Boolean)
    const method = req.method

    // Route: GET /admin-reviews/reports - Liste des reports pending
    if (method === 'GET' && pathParts[1] === 'reports') {
      const status = url.searchParams.get('status') || 'pending'
      const page = parseInt(url.searchParams.get('page') || '1')
      const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 50)
      const offset = (page - 1) * limit

      const { data: reports, error, count } = await adminClient
        .from('review_reports')
        .select(`
          *,
          review:review_id (
            id,
            content,
            anime_title,
            user_id,
            status
          ),
          reporter:reporter_id (
            display_name,
            discord_username
          )
        `, { count: 'exact' })
        .eq('status', status)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) throw error

      return new Response(
        JSON.stringify({
          reports: reports || [],
          pagination: {
            page,
            limit,
            total: count || 0,
            totalPages: Math.ceil((count || 0) / limit)
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Route: PATCH /admin-reviews/reports/:reportId - Traiter un report
    if (method === 'PATCH' && pathParts[1] === 'reports' && pathParts[2]) {
      const reportId = pathParts[2]
      const payload = await req.json()

      const { status, notes, action } = payload

      if (!['reviewed', 'dismissed', 'actioned'].includes(status)) {
        return new Response(
          JSON.stringify({ error: 'Invalid status' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Get report
      const { data: report } = await adminClient
        .from('review_reports')
        .select('review_id')
        .eq('id', reportId)
        .single()

      if (!report) {
        return new Response(
          JSON.stringify({ error: 'Report not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Update report
      const { error: updateError } = await adminClient
        .from('review_reports')
        .update({
          status,
          moderator_id: userId,
          moderator_notes: notes,
          resolved_at: new Date().toISOString()
        })
        .eq('id', reportId)

      if (updateError) throw updateError

      // Si action demandée sur la review
      if (action && status === 'actioned') {
        if (action === 'hide') {
          await adminClient
            .from('anime_reviews')
            .update({ status: 'hidden', hidden_reason: notes || 'Moderation action' })
            .eq('id', report.review_id)
        } else if (action === 'delete') {
          await adminClient
            .from('anime_reviews')
            .update({ status: 'deleted', hidden_reason: notes || 'Deleted by moderator' })
            .eq('id', report.review_id)
        }
      }

      return new Response(
        JSON.stringify({ message: 'Report processed successfully' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Route: PATCH /admin-reviews/reviews/:reviewId - Modérer une review
    if (method === 'PATCH' && pathParts[1] === 'reviews' && pathParts[2]) {
      const reviewId = pathParts[2]
      const payload = await req.json()

      const { status, reason } = payload

      if (!['visible', 'hidden', 'deleted'].includes(status)) {
        return new Response(
          JSON.stringify({ error: 'Invalid status' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { data: review, error } = await adminClient
        .from('anime_reviews')
        .update({
          status,
          hidden_reason: reason
        })
        .eq('id', reviewId)
        .select()
        .single()

      if (error) throw error

      // Recalculer summary
      await adminClient.rpc('recalculate_anime_summary', { _anime_id: review.anime_id })

      return new Response(
        JSON.stringify({ review, message: 'Review moderated successfully' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Route: POST /admin-reviews/users/:userId/ban - Bannir un utilisateur
    if (method === 'POST' && pathParts[1] === 'users' && pathParts[3] === 'ban') {
      if (!isAdmin) {
        return new Response(
          JSON.stringify({ error: 'Admin access required for bans' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const targetUserId = pathParts[2]
      const payload = await req.json()

      const { type, reason, expires_at } = payload

      if (!['shadow', 'full'].includes(type)) {
        return new Response(
          JSON.stringify({ error: 'Invalid ban type' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { error } = await adminClient
        .from('user_moderation')
        .upsert({
          user_id: targetUserId,
          ban_status: type,
          ban_reason: reason,
          ban_expires_at: expires_at
        }, { onConflict: 'user_id' })

      if (error) throw error

      // Si shadow ban, masquer toutes les reviews existantes
      if (type === 'shadow') {
        await adminClient
          .from('anime_reviews')
          .update({ status: 'hidden', hidden_reason: 'Shadow banned user' })
          .eq('user_id', targetUserId)
          .eq('status', 'visible')
      }

      return new Response(
        JSON.stringify({ message: `User ${type} banned successfully` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Route: DELETE /admin-reviews/users/:userId/ban - Débannir
    if (method === 'DELETE' && pathParts[1] === 'users' && pathParts[3] === 'ban') {
      if (!isAdmin) {
        return new Response(
          JSON.stringify({ error: 'Admin access required' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const targetUserId = pathParts[2]

      const { error } = await adminClient
        .from('user_moderation')
        .update({
          ban_status: 'none',
          ban_reason: null,
          ban_expires_at: null
        })
        .eq('user_id', targetUserId)

      if (error) throw error

      return new Response(
        JSON.stringify({ message: 'User unbanned successfully' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Route: GET /admin-reviews/stats - Statistiques modération
    if (method === 'GET' && pathParts[1] === 'stats') {
      const { data: pendingReports, error: pendingError } = await adminClient
        .from('review_reports')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending')

      const { data: hiddenReviews, error: hiddenError } = await adminClient
        .from('anime_reviews')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'hidden')

      const { data: bannedUsers, error: bannedError } = await adminClient
        .from('user_moderation')
        .select('id', { count: 'exact', head: true })
        .neq('ban_status', 'none')

      const { data: totalReviews, error: totalError } = await adminClient
        .from('anime_reviews')
        .select('id', { count: 'exact', head: true })

      return new Response(
        JSON.stringify({
          stats: {
            pending_reports: pendingReports || 0,
            hidden_reviews: hiddenReviews || 0,
            banned_users: bannedUsers || 0,
            total_reviews: totalReviews || 0
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Admin edge function error:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
