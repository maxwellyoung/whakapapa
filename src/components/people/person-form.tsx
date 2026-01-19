'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { parseFlexibleDateInput, getDatePrecisionLabel } from '@/lib/dates'
import { DuplicateWarning } from '@/components/people/duplicate-warning'
import { PhotoUploader } from '@/components/people/photo-uploader'
import type { PersonFormData, DatePrecision, Person } from '@/types'

interface PersonFormProps {
  initialData?: Person
  onSubmit: (data: PersonFormData) => Promise<void>
  onSelectExisting?: (person: Person) => void
}

const DATE_PRECISIONS: DatePrecision[] = ['exact', 'year', 'month', 'circa', 'range', 'unknown']

export function PersonForm({ initialData, onSubmit, onSelectExisting }: PersonFormProps) {
  const isNew = !initialData
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  // Name fields
  const [preferredName, setPreferredName] = useState(initialData?.preferred_name ?? '')
  const [givenNames, setGivenNames] = useState(initialData?.given_names ?? '')
  const [familyName, setFamilyName] = useState(initialData?.family_name ?? '')

  // Birth fields
  const [birthDateInput, setBirthDateInput] = useState(initialData?.birth_date ?? '')
  const [birthDatePrecision, setBirthDatePrecision] = useState<DatePrecision>(
    initialData?.birth_date_precision ?? 'unknown'
  )
  const [birthDateEnd, setBirthDateEnd] = useState(initialData?.birth_date_end ?? '')
  const [birthPlace, setBirthPlace] = useState(initialData?.birth_place ?? '')

  // Death fields
  const [deathDateInput, setDeathDateInput] = useState(initialData?.death_date ?? '')
  const [deathDatePrecision, setDeathDatePrecision] = useState<DatePrecision>(
    initialData?.death_date_precision ?? 'unknown'
  )
  const [deathDateEnd, setDeathDateEnd] = useState(initialData?.death_date_end ?? '')
  const [deathPlace, setDeathPlace] = useState(initialData?.death_place ?? '')

  // Other fields
  const [gender, setGender] = useState(initialData?.gender ?? '')
  const [bio, setBio] = useState(initialData?.bio ?? '')
  const [photoUrl, setPhotoUrl] = useState<string | null>(initialData?.photo_url ?? null)

  const handleBirthDateChange = (value: string) => {
    setBirthDateInput(value)
    const parsed = parseFlexibleDateInput(value)
    if (parsed) {
      if (parsed.precision) setBirthDatePrecision(parsed.precision)
      if (parsed.endDate) setBirthDateEnd(parsed.endDate)
    }
  }

  const handleDeathDateChange = (value: string) => {
    setDeathDateInput(value)
    const parsed = parseFlexibleDateInput(value)
    if (parsed) {
      if (parsed.precision) setDeathDatePrecision(parsed.precision)
      if (parsed.endDate) setDeathDateEnd(parsed.endDate)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!preferredName.trim()) return

    setLoading(true)

    // Parse dates
    const parsedBirth = parseFlexibleDateInput(birthDateInput)
    const parsedDeath = parseFlexibleDateInput(deathDateInput)

    await onSubmit({
      preferred_name: preferredName.trim(),
      given_names: givenNames.trim() || undefined,
      family_name: familyName.trim() || undefined,
      birth_date: (parsedBirth?.date ?? birthDateInput) || undefined,
      birth_date_precision: birthDatePrecision,
      birth_date_end: (parsedBirth?.endDate ?? birthDateEnd) || undefined,
      birth_place: birthPlace.trim() || undefined,
      death_date: (parsedDeath?.date ?? deathDateInput) || undefined,
      death_date_precision: deathDatePrecision,
      death_date_end: (parsedDeath?.endDate ?? deathDateEnd) || undefined,
      death_place: deathPlace.trim() || undefined,
      gender: gender.trim() || undefined,
      bio: bio.trim() || undefined,
      photo_url: photoUrl || undefined,
    })

    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Name & Photo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-6">
            <PhotoUploader
              currentPhotoUrl={photoUrl}
              onPhotoChange={setPhotoUrl}
              personId={initialData?.id}
            />
            <div className="flex-1 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="preferredName">Preferred name *</Label>
                <Input
                  id="preferredName"
                  placeholder="How they were known"
                  value={preferredName}
                  onChange={(e) => setPreferredName(e.target.value)}
                  required
                  autoFocus
                />
              </div>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="givenNames">Given names</Label>
              <Input
                id="givenNames"
                placeholder="First and middle names"
                value={givenNames}
                onChange={(e) => setGivenNames(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="familyName">Family name</Label>
              <Input
                id="familyName"
                placeholder="Surname"
                value={familyName}
                onChange={(e) => setFamilyName(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Birth</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="birthDate">Date</Label>
              <Input
                id="birthDate"
                placeholder="e.g., 1880, c. 1880, 12 March 1880"
                value={birthDateInput}
                onChange={(e) => handleBirthDateChange(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Supports: exact dates, years, circa, ranges
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="birthPrecision">Precision</Label>
              <Select
                value={birthDatePrecision}
                onValueChange={(v) => setBirthDatePrecision(v as DatePrecision)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DATE_PRECISIONS.map((p) => (
                    <SelectItem key={p} value={p}>
                      {getDatePrecisionLabel(p)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {birthDatePrecision === 'range' && (
            <div className="space-y-2">
              <Label htmlFor="birthDateEnd">End date (for range)</Label>
              <Input
                id="birthDateEnd"
                type="date"
                value={birthDateEnd}
                onChange={(e) => setBirthDateEnd(e.target.value)}
              />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="birthPlace">Place</Label>
            <Input
              id="birthPlace"
              placeholder="City, Region, Country"
              value={birthPlace}
              onChange={(e) => setBirthPlace(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Death</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="deathDate">Date</Label>
              <Input
                id="deathDate"
                placeholder="Leave blank if still living"
                value={deathDateInput}
                onChange={(e) => handleDeathDateChange(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deathPrecision">Precision</Label>
              <Select
                value={deathDatePrecision}
                onValueChange={(v) => setDeathDatePrecision(v as DatePrecision)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DATE_PRECISIONS.map((p) => (
                    <SelectItem key={p} value={p}>
                      {getDatePrecisionLabel(p)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {deathDatePrecision === 'range' && (
            <div className="space-y-2">
              <Label htmlFor="deathDateEnd">End date (for range)</Label>
              <Input
                id="deathDateEnd"
                type="date"
                value={deathDateEnd}
                onChange={(e) => setDeathDateEnd(e.target.value)}
              />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="deathPlace">Place</Label>
            <Input
              id="deathPlace"
              placeholder="City, Region, Country"
              value={deathPlace}
              onChange={(e) => setDeathPlace(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Additional</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="gender">Gender</Label>
            <Input
              id="gender"
              placeholder="Optional"
              value={gender}
              onChange={(e) => setGender(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bio">Biography</Label>
            <Textarea
              id="bio"
              placeholder="Notes about this person..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      {/* Duplicate warning shown after form is complete, before submit */}
      {isNew && preferredName.length >= 3 && (
        <DuplicateWarning
          personData={{
            preferred_name: preferredName,
            given_names: givenNames,
            family_name: familyName,
            birth_date: birthDateInput,
            birth_place: birthPlace,
          }}
          onSelectExisting={onSelectExisting}
        />
      )}

      {/* Sticky footer ensures submit button is always visible */}
      <div className="sticky bottom-0 bg-background pt-4 pb-6 -mx-8 px-8 border-t mt-6">
        <div className="flex gap-3">
          <Button type="submit" disabled={loading || !preferredName.trim()} size="lg">
            {loading ? 'Saving...' : initialData ? 'Save changes' : 'Add person'}
          </Button>
          <Button type="button" variant="outline" size="lg" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
        {!preferredName.trim() && (
          <p className="text-sm text-muted-foreground mt-2">
            Enter a preferred name above to save this person
          </p>
        )}
      </div>
    </form>
  )
}
