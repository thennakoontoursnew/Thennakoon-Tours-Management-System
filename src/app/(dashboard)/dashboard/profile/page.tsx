import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProfileSignatureForm } from './profile-signature-form'

export const metadata = {
  title: 'My Profile & Digital Signature — Thennakoon Tours',
}

export default async function ProfilePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, email, role, phone, designation, signature_url')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">My Profile & Digital Signature</h1>
        <p className="text-xs text-slate-500 mt-1">
          Configure your official job designation and upload your signature for Agreement Extension Letters and official documents.
        </p>
      </div>

      <ProfileSignatureForm profile={profile} />
    </div>
  )
}
