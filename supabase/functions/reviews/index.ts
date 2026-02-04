import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ReviewPayload {
  anime_id: number
  anime_title: string
  anime_image?: string
  content: string
  rating?: number
  is_spoiler?: boolean
  is_recommended?: boolean
  tags?: string[]
}

interface ReactionPayload {
  reaction: 'useful' | 'agree' | 'neutral' | 'disagree'
}

interface ReportPayload {
  reason: 'spam' | 'harassment' | 'spoiler_unmarked' | 'off_topic' | 'misinformation' | 'other'
  details?: string
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    
    const authHeader = req.headers.get('Authorization')
    
    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader || '' } }
    })

    const url = new URL(req.url)
    const pathParts = url.pathname.split('/').filter(Boolean)
    // pathParts: ['reviews', ...rest]
    
    const method = req.method
    
    // Route: GET /reviews/config - Configuration publique (AVANT les routes génériques)
    if (method === 'GET' && pathParts[1] === 'config' && !pathParts[2]) {
      const { data: config, error } = await supabase
        .from('review_config')
        .select('key, value')

      if (error) throw error

      const configObj: Record<string, unknown> = {}
      config?.forEach(c => {
        try {
          configObj[c.key] = JSON.parse(c.value as string)
        } catch {
          configObj[c.key] = c.value
        }
      })

      return new Response(
        JSON.stringify({ config: configObj }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Route: GET /reviews/summary/:animeId - Résumé communautaire
    if (method === 'GET' && pathParts[1] === 'summary' && pathParts[2]) {
      const animeId = parseInt(pathParts[2])

      const { data: summary, error } = await supabase
        .from('anime_review_summary')
        .select('*')
        .eq('anime_id', animeId)
        .maybeSingle()

      if (error) throw error

      if (!summary) {
        return new Response(
          JSON.stringify({ summary: null, message: 'No reviews yet for this anime' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ summary }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Route: GET /reviews/user/:userId - Reviews d'un utilisateur
    if (method === 'GET' && pathParts[1] === 'user' && pathParts[2]) {
      const targetUserId = pathParts[2]
      const page = parseInt(url.searchParams.get('page') || '1')
      const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 50)
      const offset = (page - 1) * limit

      const { data: reviews, error, count } = await supabase
        .from('anime_reviews')
        .select('*', { count: 'exact' })
        .eq('user_id', targetUserId)
        .eq('status', 'visible')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) throw error

      // Get badges
      const { data: badges } = await supabase
        .from('user_badges')
        .select('*')
        .eq('user_id', targetUserId)

      return new Response(
        JSON.stringify({
          reviews: reviews || [],
          badges: badges || [],
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

    // Route: GET /reviews/anime/:animeId - Liste des reviews d'un anime
    if (method === 'GET' && pathParts[1] === 'anime' && pathParts[2]) {
      const animeId = parseInt(pathParts[2])
      const sort = url.searchParams.get('sort') || 'newest'
      const spoilers = url.searchParams.get('spoilers') || 'include'
      const page = parseInt(url.searchParams.get('page') || '1')
      const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 50)
      const offset = (page - 1) * limit

      let query = supabase
        .from('anime_reviews')
        .select('*', { count: 'exact' })
        .eq('anime_id', animeId)
        .eq('status', 'visible')
        .range(offset, offset + limit - 1)

      // Filter spoilers
      if (spoilers === 'exclude') {
        query = query.eq('is_spoiler', false)
      } else if (spoilers === 'only') {
        query = query.eq('is_spoiler', true)
      }

      // Sort
      switch (sort) {
        case 'rating_desc':
          query = query.order('rating', { ascending: false, nullsFirst: false })
          break
        case 'rating_asc':
          query = query.order('rating', { ascending: true, nullsFirst: false })
          break
        case 'helpful':
          query = query.order('useful_count', { ascending: false })
          break
        default:
          query = query.order('created_at', { ascending: false })
      }

      const { data: reviews, error, count } = await query

      if (error) throw error

      // Fetch profiles separately for each review
      const reviewsWithProfiles = await Promise.all(
        (reviews || []).map(async (review) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('display_name, discord_avatar, discord_username')
            .eq('user_id', review.user_id)
            .maybeSingle()
          return { ...review, profile }
        })
      )

      // Get summary
      const { data: summary } = await supabase
        .from('anime_review_summary')
        .select('*')
        .eq('anime_id', animeId)
        .maybeSingle()

      return new Response(
        JSON.stringify({
          reviews: reviewsWithProfiles,
          summary,
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

    // Route: GET /reviews/:reviewId - Détail d'une review (DOIT être après les routes spécifiques)
    if (method === 'GET' && pathParts[1] && !pathParts[2]) {
      const reviewId = pathParts[1]

      // Validate UUID format to avoid DB errors
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      if (!uuidRegex.test(reviewId)) {
        return new Response(
          JSON.stringify({ error: 'Invalid review ID format' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { data: review, error } = await supabase
        .from('anime_reviews')
        .select('*')
        .eq('id', reviewId)
        .maybeSingle()

      if (error) throw error
      if (!review) {
        return new Response(
          JSON.stringify({ error: 'Review not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Fetch profile separately
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name, discord_avatar, discord_username')
        .eq('user_id', review.user_id)
        .maybeSingle()

      return new Response(
        JSON.stringify({ review: { ...review, profile } }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Routes nécessitant une authentification
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Vérifier l'utilisateur
    const token = authHeader.replace('Bearer ', '')
    const { data: claims, error: claimsError } = await supabase.auth.getClaims(token)
    
    if (claimsError || !claims?.claims) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const userId = claims.claims.sub as string

    // Vérifier ban status
    const { data: moderation } = await supabase
      .from('user_moderation')
      .select('ban_status, ban_expires_at, review_cooldown_until')
      .eq('user_id', userId)
      .maybeSingle()

    if (moderation?.ban_status === 'full') {
      const banExpired = moderation.ban_expires_at && new Date(moderation.ban_expires_at) < new Date()
      if (!banExpired) {
        return new Response(
          JSON.stringify({ error: 'You are banned from posting reviews' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // Route: POST /reviews - Créer une review
    if (method === 'POST' && pathParts.length === 1) {
      const payload: ReviewPayload = await req.json()

      // Validation
      if (!payload.anime_id || !payload.anime_title || !payload.content) {
        return new Response(
          JSON.stringify({ error: 'anime_id, anime_title and content are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      if (payload.content.length < 100 || payload.content.length > 2000) {
        return new Response(
          JSON.stringify({ error: 'Content must be between 100 and 2000 characters' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      if (payload.rating && (payload.rating < 1 || payload.rating > 10)) {
        return new Response(
          JSON.stringify({ error: 'Rating must be between 1 and 10' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      if (payload.tags && payload.tags.length > 5) {
        return new Response(
          JSON.stringify({ error: 'Maximum 5 tags allowed' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Vérifier si review existe déjà
      const { data: existingReview } = await supabase
        .from('anime_reviews')
        .select('id, created_at')
        .eq('user_id', userId)
        .eq('anime_id', payload.anime_id)
        .maybeSingle()

      if (existingReview) {
        return new Response(
          JSON.stringify({ error: 'You already have a review for this anime', existing_review_id: existingReview.id }),
          { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Créer la review
      const { data: review, error } = await supabase
        .from('anime_reviews')
        .insert({
          user_id: userId,
          anime_id: payload.anime_id,
          anime_title: payload.anime_title,
          anime_image: payload.anime_image,
          content: payload.content,
          rating: payload.rating,
          is_spoiler: payload.is_spoiler || false,
          is_recommended: payload.is_recommended,
          tags: payload.tags || []
        })
        .select()
        .single()

      if (error) throw error

      // Mettre à jour badges et summary en arrière-plan
      await supabase.rpc('check_and_award_badges', { _user_id: userId })
      await supabase.rpc('recalculate_anime_summary', { _anime_id: payload.anime_id })

      return new Response(
        JSON.stringify({ review, message: 'Review created successfully' }),
        { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Route: PATCH /reviews/:reviewId - Modifier sa review
    if (method === 'PATCH' && pathParts[1] && !pathParts[2]) {
      const reviewId = pathParts[1]
      const payload: Partial<ReviewPayload> = await req.json()

      // Vérifier propriété
      const { data: existingReview, error: fetchError } = await supabase
        .from('anime_reviews')
        .select('*')
        .eq('id', reviewId)
        .eq('user_id', userId)
        .maybeSingle()

      if (fetchError) throw fetchError
      if (!existingReview) {
        return new Response(
          JSON.stringify({ error: 'Review not found or not yours' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Vérifier fenêtre d'édition (24h) et max edits (3)
      const { data: config } = await supabase
        .from('review_config')
        .select('key, value')
        .in('key', ['edit_window_hours', 'max_edits'])

      const editWindowHours = parseInt(config?.find(c => c.key === 'edit_window_hours')?.value || '24')
      const maxEdits = parseInt(config?.find(c => c.key === 'max_edits')?.value || '3')

      const createdAt = new Date(existingReview.created_at)
      const editDeadline = new Date(createdAt.getTime() + editWindowHours * 60 * 60 * 1000)

      if (new Date() > editDeadline) {
        return new Response(
          JSON.stringify({ error: `Edit window expired (${editWindowHours}h after creation)` }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      if (existingReview.edit_count >= maxEdits) {
        return new Response(
          JSON.stringify({ error: `Maximum ${maxEdits} edits reached` }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Validation
      if (payload.content && (payload.content.length < 100 || payload.content.length > 2000)) {
        return new Response(
          JSON.stringify({ error: 'Content must be between 100 and 2000 characters' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Update
      const updateData: Record<string, unknown> = {
        last_edited_at: new Date().toISOString(),
        edit_count: existingReview.edit_count + 1
      }

      if (payload.content) updateData.content = payload.content
      if (payload.rating !== undefined) updateData.rating = payload.rating
      if (payload.is_spoiler !== undefined) updateData.is_spoiler = payload.is_spoiler
      if (payload.is_recommended !== undefined) updateData.is_recommended = payload.is_recommended
      if (payload.tags) updateData.tags = payload.tags

      const { data: review, error } = await supabase
        .from('anime_reviews')
        .update(updateData)
        .eq('id', reviewId)
        .select()
        .single()

      if (error) throw error

      // Recalculer summary
      await supabase.rpc('recalculate_anime_summary', { _anime_id: existingReview.anime_id })

      return new Response(
        JSON.stringify({ review, message: 'Review updated successfully' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Route: DELETE /reviews/:reviewId - Supprimer sa review
    if (method === 'DELETE' && pathParts[1] && !pathParts[2]) {
      const reviewId = pathParts[1]

      const { data: existingReview } = await supabase
        .from('anime_reviews')
        .select('anime_id')
        .eq('id', reviewId)
        .eq('user_id', userId)
        .maybeSingle()

      if (!existingReview) {
        return new Response(
          JSON.stringify({ error: 'Review not found or not yours' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { error } = await supabase
        .from('anime_reviews')
        .delete()
        .eq('id', reviewId)

      if (error) throw error

      // Recalculer
      await supabase.rpc('check_and_award_badges', { _user_id: userId })
      await supabase.rpc('recalculate_anime_summary', { _anime_id: existingReview.anime_id })

      return new Response(
        JSON.stringify({ message: 'Review deleted successfully' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Route: POST /reviews/:reviewId/reactions - Réagir
    if (method === 'POST' && pathParts[2] === 'reactions') {
      const reviewId = pathParts[1]
      const payload: ReactionPayload = await req.json()

      if (!['useful', 'agree', 'neutral', 'disagree'].includes(payload.reaction)) {
        return new Response(
          JSON.stringify({ error: 'Invalid reaction type' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Vérifier que la review existe
      const { data: review } = await supabase
        .from('anime_reviews')
        .select('id, user_id')
        .eq('id', reviewId)
        .eq('status', 'visible')
        .maybeSingle()

      if (!review) {
        return new Response(
          JSON.stringify({ error: 'Review not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Empêcher de réagir à sa propre review
      if (review.user_id === userId) {
        return new Response(
          JSON.stringify({ error: 'Cannot react to your own review' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Upsert reaction
      const { data: reaction, error } = await supabase
        .from('review_reactions')
        .upsert({
          review_id: reviewId,
          user_id: userId,
          reaction: payload.reaction
        }, { onConflict: 'review_id,user_id' })
        .select()
        .single()

      if (error) throw error

      return new Response(
        JSON.stringify({ reaction, message: 'Reaction saved' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Route: DELETE /reviews/:reviewId/reactions - Supprimer réaction
    if (method === 'DELETE' && pathParts[2] === 'reactions') {
      const reviewId = pathParts[1]

      const { error } = await supabase
        .from('review_reactions')
        .delete()
        .eq('review_id', reviewId)
        .eq('user_id', userId)

      if (error) throw error

      return new Response(
        JSON.stringify({ message: 'Reaction removed' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Route: POST /reviews/:reviewId/reports - Signaler
    if (method === 'POST' && pathParts[2] === 'reports') {
      const reviewId = pathParts[1]
      const payload: ReportPayload = await req.json()

      const validReasons = ['spam', 'harassment', 'spoiler_unmarked', 'off_topic', 'misinformation', 'other']
      if (!validReasons.includes(payload.reason)) {
        return new Response(
          JSON.stringify({ error: 'Invalid report reason' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Vérifier que la review existe
      const { data: review } = await supabase
        .from('anime_reviews')
        .select('id, user_id')
        .eq('id', reviewId)
        .maybeSingle()

      if (!review) {
        return new Response(
          JSON.stringify({ error: 'Review not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Empêcher de signaler sa propre review
      if (review.user_id === userId) {
        return new Response(
          JSON.stringify({ error: 'Cannot report your own review' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { data: report, error } = await supabase
        .from('review_reports')
        .insert({
          review_id: reviewId,
          reporter_id: userId,
          reason: payload.reason,
          details: payload.details
        })
        .select()
        .single()

      if (error) {
        if (error.code === '23505') { // Unique violation
          return new Response(
            JSON.stringify({ error: 'You already reported this review' }),
            { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
        throw error
      }

      return new Response(
        JSON.stringify({ report, message: 'Report submitted' }),
        { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Edge function error:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
