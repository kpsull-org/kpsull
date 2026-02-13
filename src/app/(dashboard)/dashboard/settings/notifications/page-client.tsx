'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Bell, Mail, Lock } from 'lucide-react';
import type { NotificationPreferenceItem } from '@/modules/notifications/application/use-cases/get-notification-preferences.use-case';

interface Props {
  preferences: NotificationPreferenceItem[];
}

function Toggle({
  checked,
  disabled,
  onChange,
}: {
  checked: boolean;
  disabled?: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={`
        relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent
        transition-colors duration-200 ease-in-out
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${checked ? 'bg-primary' : 'bg-muted'}
      `}
    >
      <span
        className={`
          pointer-events-none inline-block h-5 w-5 rounded-full bg-background shadow-lg ring-0
          transition-transform duration-200 ease-in-out
          ${checked ? 'translate-x-5' : 'translate-x-0'}
        `}
      />
    </button>
  );
}

export function NotificationPreferencesClient({ preferences }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [localPrefs, setLocalPrefs] = useState(preferences);
  const [savingType, setSavingType] = useState<string | null>(null);

  const categories = Array.from(new Set(localPrefs.map((p) => p.category)));

  async function handleToggle(
    type: string,
    field: 'email' | 'inApp',
    value: boolean
  ) {
    const pref = localPrefs.find((p) => p.type === type);
    if (!pref || pref.isMandatory) return;

    const newEmail = field === 'email' ? value : pref.email;
    const newInApp = field === 'inApp' ? value : pref.inApp;

    setLocalPrefs((prev) =>
      prev.map((p) =>
        p.type === type ? { ...p, [field]: value } : p
      )
    );
    setSavingType(type);

    try {
      const response = await fetch('/api/creator/notifications/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, email: newEmail, inApp: newInApp }),
      });

      if (!response.ok) {
        setLocalPrefs((prev) =>
          prev.map((p) =>
            p.type === type ? { ...p, [field]: !value } : p
          )
        );
      } else {
        startTransition(() => {
          router.refresh();
        });
      }
    } catch {
      setLocalPrefs((prev) =>
        prev.map((p) =>
          p.type === type ? { ...p, [field]: !value } : p
        )
      );
    } finally {
      setSavingType(null);
    }
  }

  return (
    <div className="space-y-6">
      {categories.map((category) => {
        const categoryPrefs = localPrefs.filter((p) => p.category === category);

        return (
          <Card key={category}>
            <CardContent className="pt-6">
              <h2 className="text-lg font-semibold mb-4">{category}</h2>
              <div className="space-y-4">
                {categoryPrefs.map((pref) => (
                  <div
                    key={pref.type}
                    className="flex items-center justify-between py-3 border-b last:border-b-0"
                  >
                    <div className="flex-1 min-w-0 pr-4">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{pref.label}</span>
                        {pref.isMandatory && (
                          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                            <Lock className="h-3 w-3" />
                            Obligatoire
                          </span>
                        )}
                        {savingType === pref.type && (
                          <span className="text-xs text-muted-foreground animate-pulse">
                            Sauvegarde...
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {pref.description}
                      </p>
                    </div>
                    <div className="flex items-center gap-6 shrink-0">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <Toggle
                          checked={pref.email}
                          disabled={pref.isMandatory || isPending}
                          onChange={(value) => handleToggle(pref.type, 'email', value)}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Bell className="h-4 w-4 text-muted-foreground" />
                        <Toggle
                          checked={pref.inApp}
                          disabled={pref.isMandatory || isPending}
                          onChange={(value) => handleToggle(pref.type, 'inApp', value)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}

      <p className="text-xs text-muted-foreground">
        <Lock className="h-3 w-3 inline mr-1" />
        Les notifications marquees &quot;Obligatoire&quot; ne peuvent pas etre desactivees car elles sont essentielles au fonctionnement de votre compte.
      </p>
    </div>
  );
}
