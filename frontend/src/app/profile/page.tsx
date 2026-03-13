'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, User, MapPin, Shield, Camera, Save, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export default function ProfilePage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState({
    full_name: '',
    region: '',
    role: '',
    avatar_url: ''
  })

  // Dummy user ID for demonstration - in real app, we'd get this from Auth
  const USER_ID = 'demo-worker-123'

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch(`http://localhost:8000/profiles/${USER_ID}`)
        if (res.ok) {
          const data = await res.json()
          setProfile(data)
        }
      } catch (err) {
        console.error('Error fetching profile:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch(`http://localhost:8000/profiles/${USER_ID}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile)
      })
      if (res.ok) {
        toast.success('Profile updated successfully')
      } else {
        toast.error('Failed to update profile')
      }
    } catch (err) {
      toast.error('Network error occurred')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="dark min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="dark min-h-screen bg-background text-foreground font-body pb-20">
      <nav className="border-b border-border bg-card/50 backdrop-blur-md px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <Link href="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <span className="font-display text-lg font-bold tracking-tight uppercase">User Account Settings</span>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-10">
        <div className="flex items-center gap-6 mb-10">
          <div className="relative group">
            <div className="h-24 w-24 rounded-full bg-secondary flex items-center justify-center overflow-hidden border-2 border-primary/20">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                <User className="h-10 w-10 text-muted-foreground" />
              )}
            </div>
            <button className="absolute bottom-0 right-0 p-1.5 bg-primary text-primary-foreground rounded-full shadow-lg hover:scale-110 transition-transform">
              <Camera className="h-4 w-4" />
            </button>
          </div>
          <div>
            <h1 className="font-display text-3xl font-black tracking-tight">{profile.full_name || 'Healthcare Worker'}</h1>
            <p className="text-muted-foreground font-medium uppercase tracking-widest text-[10px] mt-1">
              Verified {profile.role || 'Member'} • {profile.region || 'India'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-6">
            <Card className="bg-card/50 border-border shadow-2xl">
              <CardHeader>
                <CardTitle className="font-display text-xl">Personal Information</CardTitle>
                <CardDescription>Update your public profile details that will be visible to other workers.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Official Name</Label>
                  <Input 
                    id="name" 
                    value={profile.full_name} 
                    onChange={e => setProfile({...profile, full_name: e.target.value})}
                    placeholder="E.g. Dr. Bora Asha" 
                    className="bg-background/50"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="region">Operational Region</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input 
                        id="region" 
                        value={profile.region} 
                        onChange={e => setProfile({...profile, region: e.target.value})}
                        className="pl-9 bg-background/50" 
                        placeholder="State / District"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Current Designation</Label>
                    <div className="relative">
                      <Shield className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input 
                        id="role" 
                        value={profile.role} 
                        onChange={e => setProfile({...profile, role: e.target.value})}
                        className="pl-9 bg-background/50" 
                        placeholder="ASHA Worker / Doctor"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="border-t border-border pt-6 mt-4">
                <Button 
                  onClick={handleSave} 
                  disabled={saving}
                  variant="medical" 
                  className="w-full sm:w-auto font-bold tracking-tight rounded-xl"
                >
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  SAVE CHANGES
                </Button>
              </CardFooter>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="bg-secondary/20 border-border border-dashed">
              <CardHeader>
                <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Account Status</CardTitle>
              </CardHeader>
              <CardContent>
                 <div className="flex items-center gap-3 mb-6">
                    <div className="h-2 w-2 rounded-full bg-medical-green animate-pulse"></div>
                    <span className="text-xs font-bold text-medical-green">ACTIVE SESSION</span>
                 </div>
                 <p className="text-[10px] text-muted-foreground leading-relaxed">
                   Your profile is synced with the Sanjeevani Central Registry. Updates may take up to 2 minutes to reflect across all clinic consoles.
                 </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
