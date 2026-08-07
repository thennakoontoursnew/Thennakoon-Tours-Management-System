'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createContentItemAction(contentData: any) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const cntNum = `CNT-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`

  const { error } = await supabase.from('marketing_content').insert({
    content_number: cntNum,
    title: contentData.title,
    description: contentData.description || null,
    content_type: contentData.content_type || 'Facebook Post',
    platforms: contentData.platforms || ['facebook'],
    campaign_id: contentData.campaign_id || null,
    offer_id: contentData.offer_id || null,
    status: contentData.status || 'idea',
    priority: contentData.priority || 'normal',
    content_pillar: contentData.content_pillar || 'Vehicle Showcase',
    planned_publish_at: contentData.planned_publish_at || null,
    caption: contentData.caption || null,
    hashtags: contentData.hashtags || null,
    script: contentData.script || null,
    cta: contentData.cta || null,
    created_by: user?.id || null,
  })

  if (error) {
    throw new Error(`Failed to create content item: ${error.message}`)
  }

  revalidatePath('/dashboard/marketing/planner')
  revalidatePath('/dashboard/marketing/calendar')
  return { success: true }
}

export async function changeContentStatusAction(contentId: string, status: string) {
  const supabase = await createClient()

  const updatePayload: any = { status, updated_at: new Date().toISOString() }

  if (status === 'published') {
    updatePayload.actual_publish_at = new Date().toISOString()
  }

  const { error } = await supabase
    .from('marketing_content')
    .update(updatePayload)
    .eq('id', contentId)

  if (error) {
    throw new Error(`Failed to update content status: ${error.message}`)
  }

  revalidatePath('/dashboard/marketing/planner')
  revalidatePath('/dashboard/marketing/calendar')
  return { success: true }
}

export async function createCampaignAction(campaignData: any) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const cmpNum = `CMP-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`

  const { error } = await supabase.from('marketing_campaigns').insert({
    campaign_number: cmpNum,
    name: campaignData.name,
    description: campaignData.description || null,
    objective: campaignData.objective || 'Lead Generation',
    status: campaignData.status || 'draft',
    start_date: campaignData.start_date,
    end_date: campaignData.end_date,
    budget: campaignData.budget || 0,
    actual_spend: campaignData.actual_spend || 0,
    platforms: campaignData.platforms || ['facebook'],
    created_by: user?.id || null,
  })

  if (error) {
    throw new Error(`Failed to create campaign: ${error.message}`)
  }

  revalidatePath('/dashboard/marketing/campaigns')
  return { success: true }
}

export async function createOfferAction(offerData: any) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const offNum = `OFF-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`

  const { error } = await supabase.from('marketing_offers').insert({
    offer_number: offNum,
    name: offerData.name,
    description: offerData.description || null,
    offer_type: offerData.offer_type || 'Percentage Discount',
    status: offerData.status || 'active',
    start_at: offerData.start_at || new Date().toISOString(),
    end_at: offerData.end_at || new Date(Date.now() + 30 * 86400000).toISOString(),
    discount_type: offerData.discount_type || 'percentage',
    discount_value: offerData.discount_value || 10,
    promo_code: offerData.promo_code || null,
    created_by: user?.id || null,
  })

  if (error) {
    throw new Error(`Failed to create offer: ${error.message}`)
  }

  revalidatePath('/dashboard/marketing/offers')
  return { success: true }
}

export async function recordManualSocialSnapshotAction(metricData: any) {
  const supabase = await createClient()

  const { error } = await supabase.from('social_metric_snapshots').upsert(
    {
      social_account_id: metricData.social_account_id,
      metric_date: metricData.metric_date || new Date().toISOString().slice(0, 10),
      followers: metricData.followers || 0,
      reach: metricData.reach || 0,
      impressions: metricData.impressions || 0,
      views: metricData.views || 0,
      engagements: metricData.engagements || 0,
      source: 'manual',
    },
    { onConflict: 'social_account_id, metric_date' }
  )

  if (error) {
    throw new Error(`Failed to record social metric: ${error.message}`)
  }

  revalidatePath('/dashboard/marketing/social')
  revalidatePath('/dashboard/marketing/analytics')
  return { success: true }
}
