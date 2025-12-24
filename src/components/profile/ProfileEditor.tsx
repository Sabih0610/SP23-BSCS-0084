import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Upload, X, Plus, Trash2, FileText } from 'lucide-react';
import { z } from 'zod';

// Validation schemas
const profileSchema = z.object({
  full_name: z.string().max(100, 'Name must be less than 100 characters').nullable(),
  headline: z.string().max(200, 'Headline must be less than 200 characters').nullable(),
  bio: z.string().max(2000, 'Bio must be less than 2000 characters').nullable(),
});

const skillSchema = z.string()
  .trim()
  .min(1, 'Skill name is required')
  .max(50, 'Skill must be less than 50 characters')
  .regex(/^[a-zA-Z0-9\s\-+#.]+$/, 'Skill contains invalid characters');

const experienceSchema = z.object({
  job_title: z.string().trim().min(1, 'Job title is required').max(100, 'Job title must be less than 100 characters'),
  company: z.string().trim().min(1, 'Company is required').max(100, 'Company must be less than 100 characters'),
  location: z.string().max(100, 'Location must be less than 100 characters').nullable(),
  description: z.string().max(2000, 'Description must be less than 2000 characters').nullable(),
});

interface Profile {
  id: string;
  full_name: string | null;
  headline: string | null;
  bio: string | null;
  resume_url: string | null;
}

interface Skill {
  id: string;
  skill_name: string;
}

interface Experience {
  id: string;
  job_title: string;
  company: string;
  location: string | null;
  start_date: string;
  end_date: string | null;
  is_current: boolean;
  description: string | null;
}

export function ProfileEditor() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [newSkill, setNewSkill] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchProfileData();
    }
  }, [user]);

  const fetchProfileData = async () => {
    if (!user) return;
    
    try {
      const [profileRes, skillsRes, expRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('user_skills').select('*').eq('user_id', user.id),
        supabase.from('user_experience').select('*').eq('user_id', user.id).order('start_date', { ascending: false }),
      ]);

      if (profileRes.data) setProfile(profileRes.data);
      if (skillsRes.data) setSkills(skillsRes.data);
      if (expRes.data) setExperiences(expRes.data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileUpdate = async () => {
    if (!user || !profile) return;
    
    // Validate profile data
    const validation = profileSchema.safeParse({
      full_name: profile.full_name,
      headline: profile.headline,
      bio: profile.bio,
    });
    
    if (!validation.success) {
      toast.error(validation.error.errors[0]?.message || 'Invalid profile data');
      return;
    }
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: profile.full_name,
          headline: profile.headline,
          bio: profile.bio,
        })
        .eq('id', user.id);

      if (error) throw error;
      toast.success('Profile updated successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    setIsUploading(true);
    try {
      const filePath = `${user.id}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ resume_url: filePath })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setProfile(prev => prev ? { ...prev, resume_url: filePath } : null);
      toast.success('Resume uploaded successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload resume');
    } finally {
      setIsUploading(false);
    }
  };

  const addSkill = async () => {
    if (!user || !newSkill.trim()) return;

    // Validate skill
    const validation = skillSchema.safeParse(newSkill);
    if (!validation.success) {
      toast.error(validation.error.errors[0]?.message || 'Invalid skill name');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_skills')
        .insert({ user_id: user.id, skill_name: validation.data })
        .select()
        .single();

      if (error) throw error;
      setSkills(prev => [...prev, data]);
      setNewSkill('');
    } catch (error: any) {
      if (error.code === '23505') {
        toast.error('Skill already added');
      } else {
        toast.error('Failed to add skill');
      }
    }
  };

  const removeSkill = async (skillId: string) => {
    try {
      const { error } = await supabase
        .from('user_skills')
        .delete()
        .eq('id', skillId);

      if (error) throw error;
      setSkills(prev => prev.filter(s => s.id !== skillId));
    } catch (error) {
      toast.error('Failed to remove skill');
    }
  };

  const addExperience = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_experience')
        .insert({
          user_id: user.id,
          job_title: 'New Position',
          company: 'Company Name',
          start_date: new Date().toISOString().split('T')[0],
          is_current: true,
        })
        .select()
        .single();

      if (error) throw error;
      setExperiences(prev => [data, ...prev]);
    } catch (error) {
      toast.error('Failed to add experience');
    }
  };

  const updateExperience = async (id: string, updates: Partial<Experience>) => {
    // Validate text fields if they're being updated
    if (updates.job_title !== undefined || updates.company !== undefined || 
        updates.location !== undefined || updates.description !== undefined) {
      const currentExp = experiences.find(e => e.id === id);
      if (currentExp) {
        const toValidate = {
          job_title: updates.job_title ?? currentExp.job_title,
          company: updates.company ?? currentExp.company,
          location: updates.location ?? currentExp.location,
          description: updates.description ?? currentExp.description,
        };
        const validation = experienceSchema.safeParse(toValidate);
        if (!validation.success) {
          toast.error(validation.error.errors[0]?.message || 'Invalid experience data');
          return;
        }
      }
    }

    try {
      const { error } = await supabase
        .from('user_experience')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      setExperiences(prev =>
        prev.map(exp => (exp.id === id ? { ...exp, ...updates } : exp))
      );
    } catch (error) {
      toast.error('Failed to update experience');
    }
  };

  const deleteExperience = async (id: string) => {
    try {
      const { error } = await supabase
        .from('user_experience')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setExperiences(prev => prev.filter(exp => exp.id !== id));
    } catch (error) {
      toast.error('Failed to delete experience');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="full_name">Full Name</Label>
            <Input
              id="full_name"
              value={profile?.full_name || ''}
              onChange={(e) => setProfile(prev => prev ? { ...prev, full_name: e.target.value } : null)}
              placeholder="Your full name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="headline">Professional Headline</Label>
            <Input
              id="headline"
              value={profile?.headline || ''}
              onChange={(e) => setProfile(prev => prev ? { ...prev, headline: e.target.value } : null)}
              placeholder="e.g. Senior Software Engineer at Tech Corp"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={profile?.bio || ''}
              onChange={(e) => setProfile(prev => prev ? { ...prev, bio: e.target.value } : null)}
              placeholder="Tell us about yourself..."
              rows={4}
            />
          </div>

          <Button onClick={handleProfileUpdate} disabled={isSaving} variant="user">
            {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Save Changes
          </Button>
        </CardContent>
      </Card>

      {/* Resume Upload */}
      <Card>
        <CardHeader>
          <CardTitle>Resume</CardTitle>
        </CardHeader>
        <CardContent>
          {profile?.resume_url ? (
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <FileText className="w-5 h-5 text-user-primary" />
              <span className="flex-1 truncate text-sm">{profile.resume_url.split('/').pop()}</span>
              <Button size="sm" variant="ghost" asChild>
                <label className="cursor-pointer">
                  Replace
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    className="hidden"
                    onChange={handleResumeUpload}
                  />
                </label>
              </Button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg cursor-pointer hover:border-user-primary/50 transition-colors">
              {isUploading ? (
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              ) : (
                <>
                  <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                  <span className="text-sm text-muted-foreground">Upload your resume (PDF, DOC, DOCX)</span>
                  <span className="text-xs text-muted-foreground mt-1">Max 5MB</span>
                </>
              )}
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                className="hidden"
                onChange={handleResumeUpload}
                disabled={isUploading}
              />
            </label>
          )}
        </CardContent>
      </Card>

      {/* Skills */}
      <Card>
        <CardHeader>
          <CardTitle>Skills</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {skills.map((skill) => (
              <Badge key={skill.id} variant="secondary" className="gap-1 pr-1">
                {skill.skill_name}
                <button
                  onClick={() => removeSkill(skill.id)}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>

          <div className="flex gap-2">
            <Input
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              placeholder="Add a skill..."
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
            />
            <Button onClick={addSkill} variant="outline" size="icon">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Experience */}
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Experience</CardTitle>
          <Button onClick={addExperience} variant="outline" size="sm" className="gap-1">
            <Plus className="w-4 h-4" />
            Add
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {experiences.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No experience added yet. Click "Add" to get started.
            </p>
          ) : (
            experiences.map((exp) => (
              <div key={exp.id} className="p-4 border rounded-lg space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 grid md:grid-cols-2 gap-3">
                    <Input
                      value={exp.job_title}
                      onChange={(e) => updateExperience(exp.id, { job_title: e.target.value })}
                      placeholder="Job Title"
                    />
                    <Input
                      value={exp.company}
                      onChange={(e) => updateExperience(exp.id, { company: e.target.value })}
                      placeholder="Company"
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive ml-2"
                    onClick={() => deleteExperience(exp.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                <div className="grid md:grid-cols-3 gap-3">
                  <Input
                    value={exp.location || ''}
                    onChange={(e) => updateExperience(exp.id, { location: e.target.value })}
                    placeholder="Location"
                  />
                  <Input
                    type="date"
                    value={exp.start_date}
                    onChange={(e) => updateExperience(exp.id, { start_date: e.target.value })}
                  />
                  <Input
                    type="date"
                    value={exp.end_date || ''}
                    onChange={(e) => updateExperience(exp.id, { end_date: e.target.value || null })}
                    disabled={exp.is_current}
                    placeholder="End Date"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={`current-${exp.id}`}
                    checked={exp.is_current}
                    onChange={(e) => updateExperience(exp.id, { is_current: e.target.checked, end_date: e.target.checked ? null : exp.end_date })}
                    className="rounded"
                  />
                  <Label htmlFor={`current-${exp.id}`} className="text-sm">
                    I currently work here
                  </Label>
                </div>

                <Textarea
                  value={exp.description || ''}
                  onChange={(e) => updateExperience(exp.id, { description: e.target.value })}
                  placeholder="Describe your responsibilities and achievements..."
                  rows={2}
                />
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
