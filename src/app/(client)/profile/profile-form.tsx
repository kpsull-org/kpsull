'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, User, Mail, Camera, X, Phone, MapPin } from 'lucide-react';
import { updateProfile } from './actions';

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

interface ProfileFormProps {
  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
    phone: string | null;
    address: string | null;
    city: string | null;
    postalCode: string | null;
    country: string | null;
  };
}

export function ProfileForm({ user }: ProfileFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(user.name);
  const [image, setImage] = useState(user.image ?? '');
  const [phone, setPhone] = useState(user.phone ?? '');
  const [address, setAddress] = useState(user.address ?? '');
  const [city, setCity] = useState(user.city ?? '');
  const [postalCode, setPostalCode] = useState(user.postalCode ?? '');
  const [country, setCountry] = useState(user.country ?? '');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const validateFile = useCallback((file: File): string | null => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return 'Format non supporte. Utilisez JPG, PNG, WebP ou GIF.';
    }
    if (file.size > MAX_SIZE) {
      return 'Le fichier ne doit pas depasser 5 MB.';
    }
    return null;
  }, []);

  const handleFileSelect = useCallback(
    (file: File) => {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }

      setError(null);
      setSelectedFile(file);

      // Create preview
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
    },
    [validateFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      const file = e.dataTransfer.files[0];
      if (file) {
        handleFileSelect(file);
      }
    },
    [handleFileSelect]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFileSelect(file);
      }
    },
    [handleFileSelect]
  );

  function clearSelectedFile() {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  async function uploadFile(): Promise<string | null> {
    if (!selectedFile) return null;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await fetch('/api/upload/avatar', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? 'Erreur upload');
      }

      return data.url as string;
    } finally {
      setIsUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      let imageUrl = image;

      // Upload new photo if selected
      if (selectedFile) {
        const uploadedUrl = await uploadFile();
        if (uploadedUrl) {
          imageUrl = uploadedUrl;
          setImage(uploadedUrl);
          clearSelectedFile();
        }
      }

      const result = await updateProfile({
        name: name || null,
        image: imageUrl || null,
        phone: phone || null,
        address: address || null,
        city: city || null,
        postalCode: postalCode || null,
        country: country || null,
      });

      if (!result.success && result.error) {
        setError(result.error);
      } else {
        setSuccess(true);
        router.refresh();
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch {
      setError('Une erreur est survenue. Veuillez reessayer.');
    } finally {
      setIsLoading(false);
    }
  }

  const initials = name
    ? name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U';

  const displayImage = previewUrl ?? (image || undefined);
  const isBusy = isLoading || isUploading;

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Informations personnelles</CardTitle>
          <CardDescription>
            Modifiez vos informations de profil
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar section */}
          <div className="space-y-3">
            <Label className="mb-2 block">
              <Camera className="mr-2 inline-block h-4 w-4" />
              Photo de profil
            </Label>

            <div
              className="flex items-center gap-4"
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {/* Avatar with overlay button */}
              <div className="relative shrink-0 group">
                <Avatar className="h-20 w-20">
                  <AvatarImage
                    src={displayImage}
                    alt={name || 'Avatar'}
                    referrerPolicy="no-referrer"
                  />
                  <AvatarFallback className="text-lg">{initials}</AvatarFallback>
                </Avatar>
                <button
                  type="button"
                  onClick={() => !isBusy && fileInputRef.current?.click()}
                  disabled={isBusy}
                  className="absolute inset-0 flex items-center justify-center rounded-full bg-black/0 transition-colors group-hover:bg-black/40"
                >
                  {isUploading ? (
                    <Loader2 className="h-5 w-5 animate-spin text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  ) : (
                    <Camera className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                </button>
              </div>

              {/* Info + actions */}
              <div className="flex-1 min-w-0">
                {selectedFile ? (
                  <div className="flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-2">
                    <Camera className="h-4 w-4 text-primary shrink-0" />
                    <span className="flex-1 truncate text-sm">{selectedFile.name}</span>
                    <button
                      type="button"
                      onClick={clearSelectedFile}
                      className="rounded-full p-0.5 hover:bg-primary/20 shrink-0"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <div>
                    <button
                      type="button"
                      onClick={() => !isBusy && fileInputRef.current?.click()}
                      disabled={isBusy}
                      className="text-sm font-medium text-primary hover:underline underline-offset-2 disabled:opacity-50"
                    >
                      {isUploading ? 'Upload en cours...' : 'Changer la photo'}
                    </button>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      JPG, PNG, WebP, GIF - 5 MB max
                    </p>
                  </div>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED_TYPES.join(',')}
                onChange={handleInputChange}
                className="hidden"
              />
            </div>
          </div>

          {/* Name field */}
          <div className="space-y-2">
            <Label htmlFor="name" className="mb-2 block">
              <User className="mr-2 inline-block h-4 w-4" />
              Nom complet
            </Label>
            <Input
              id="name"
              type="text"
              placeholder="Votre nom"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isBusy}
            />
          </div>

          {/* Email field (read-only) */}
          <div className="space-y-2">
            <Label htmlFor="email" className="mb-2 block">
              <Mail className="mr-2 inline-block h-4 w-4" />
              Adresse email
            </Label>
            <Input
              id="email"
              type="email"
              value={user.email}
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">
              L&apos;email ne peut pas etre modifie pour le moment
            </p>
          </div>

          {/* Phone field */}
          <div className="space-y-2">
            <Label htmlFor="phone" className="mb-2 block">
              <Phone className="mr-2 inline-block h-4 w-4" />
              Telephone
            </Label>
            <Input
              id="phone"
              type="tel"
              placeholder="06 12 34 56 78"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={isBusy}
            />
            <p className="text-xs text-muted-foreground">
              Format 06 12 34 56 78 ou +33 6 12 34 56 78
            </p>
          </div>

          {/* Address section */}
          <div className="space-y-4">
            <Label className="mb-2 block">
              <MapPin className="mr-2 inline-block h-4 w-4" />
              Adresse
            </Label>
            <div className="space-y-3">
              <Input
                id="address"
                placeholder="Numero et nom de rue"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                disabled={isBusy}
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  id="postalCode"
                  placeholder="Code postal"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  disabled={isBusy}
                />
                <Input
                  id="city"
                  placeholder="Ville"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  disabled={isBusy}
                />
              </div>
              <Input
                id="country"
                placeholder="Pays"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                disabled={isBusy}
              />
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* Success message */}
          {success && (
            <div className="rounded-md bg-green-100 p-3 text-sm text-green-800 dark:bg-green-900/30 dark:text-green-400">
              Profil mis a jour avec succes !
            </div>
          )}

          {/* Submit button */}
          <Button type="submit" disabled={isBusy}>
            {isBusy ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isUploading ? 'Upload en cours...' : 'Enregistrement...'}
              </>
            ) : (
              'Enregistrer les modifications'
            )}
          </Button>
        </CardContent>
      </Card>
    </form>
  );
}
