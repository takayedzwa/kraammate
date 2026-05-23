// Internationalization (i18n) configuration for Dutch Babies Green Book
// Supports Dutch (nl) and English (en)

export type Locale = 'en' | 'nl';

export const defaultLocale: Locale = 'en';

export const translations = {
  en: {
    // Navigation
    'nav.home': 'Home',
    'nav.log': 'Log',
    'nav.milestones': 'Milestones',
    'nav.health': 'Health',
    'nav.reports': 'Reports',

    // Common
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.loading': 'Loading...',
    'common.error': 'Something went wrong',
    'common.success': 'Success!',

    // Dashboard
    'dashboard.greeting.morning': 'Good morning',
    'dashboard.greeting.afternoon': 'Good afternoon',
    'dashboard.greeting.evening': 'Good evening',
    'dashboard.summary': "Today's Summary",
    'dashboard.feedings': 'Feedings',
    'dashboard.sleeps': 'Sleeps',
    'dashboard.diapers': 'Diapers',

    // Tracking
    'tracking.feeding': 'Feeding',
    'tracking.sleep': 'Sleep',
    'tracking.diaper': 'Diaper',
    'tracking.growth': 'Growth',
    'tracking.logFeeding': 'Log Feeding',
    'tracking.logSleep': 'Log Sleep',
    'tracking.logDiaper': 'Log Diaper Change',

    // Feeding
    'feeding.type': 'Feeding Type',
    'feeding.breast': 'Breast',
    'feeding.bottle': 'Bottle',
    'feeding.pumping': 'Pumping',
    'feeding.mixed': 'Mixed',
    'feeding.duration': 'Duration (minutes)',
    'feeding.amount': 'Amount (ml)',
    'feeding.breastSide': 'Breast Side',
    'feeding.left': 'Left',
    'feeding.right': 'Right',
    'feeding.both': 'Both',

    // Sleep
    'sleep.type': 'Sleep Type',
    'sleep.nap': 'Nap',
    'sleep.night': 'Night',
    'sleep.startTime': 'Start Time',
    'sleep.endTime': 'End Time',
    'sleep.quality': 'Sleep Quality',
    'sleep.location': 'Sleep Location',

    // Diaper
    'diaper.type': 'Type',
    'diaper.wet': 'Wet',
    'diaper.dirty': 'Dirty',
    'diaper.mixed': 'Mixed',
    'diaper.amount': 'Amount',
    'diaper.color': 'Color',
    'diaper.consistency': 'Consistency',

    // Baby Profile
    'baby.name': "Baby's Name",
    'baby.dob': 'Date of Birth',
    'baby.gender': 'Gender',
    'baby.boy': 'Boy',
    'baby.girl': 'Girl',
    'baby.other': 'Other',
    'baby.weight': 'Birth Weight (kg)',
    'baby.height': 'Birth Length (cm)',
    'baby.head': 'Head Circumference (cm)',
    'baby.gestational': 'Gestational Age (weeks)',

    // Milestones
    'milestones.add': 'Add Milestone',
    'milestones.firstSmile': 'First Smile',
    'milestones.firstLaugh': 'First Laugh',
    'milestones.rollingOver': 'Rolling Over',
    'milestones.sittingUp': 'Sitting Up',
    'milestones.crawling': 'Crawling',
    'milestones.firstSteps': 'First Steps',
    'milestones.firstWords': 'First Words',
    'milestones.firstTeeth': 'First Teeth',

    // Sharing
    'share.title': 'Share Access',
    'share.generateLink': 'Generate Share Link',
    'share.copyLink': 'Copy Link',
    'share.viewOnly': 'View Only',
    'share.viewEdit': 'View & Edit',

    // Auth
    'auth.signIn': 'Sign In',
    'auth.signUp': 'Sign Up',
    'auth.signOut': 'Sign Out',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.google': 'Continue with Google',
    'auth.magicLink': 'Send magic link',
  },
  nl: {
    // Navigation
    'nav.home': 'Home',
    'nav.log': 'Loggen',
    'nav.milestones': 'Mijlpalen',
    'nav.health': 'Gezondheid',
    'nav.reports': 'Rapporten',

    // Common
    'common.save': 'Opslaan',
    'common.cancel': 'Annuleren',
    'common.delete': 'Verwijderen',
    'common.edit': 'Bewerken',
    'common.loading': 'Laden...',
    'common.error': 'Er ging iets mis',
    'common.success': 'Gelukt!',

    // Dashboard
    'dashboard.greeting.morning': 'Goedemorgen',
    'dashboard.greeting.afternoon': 'Goedemiddag',
    'dashboard.greeting.evening': 'Goedenavond',
    'dashboard.summary': "Vandaag's Overzicht",
    'dashboard.feedings': 'Voedingen',
    'dashboard.sleeps': 'Slaapmomenten',
    'dashboard.diapers': 'Luiers',

    // Tracking
    'tracking.feeding': 'Voeding',
    'tracking.sleep': 'Slaap',
    'tracking.diaper': 'Luier',
    'tracking.growth': 'Groei',
    'tracking.logFeeding': 'Voeding Loggen',
    'tracking.logSleep': 'Slaap Loggen',
    'tracking.logDiaper': 'Luier verschonen',

    // Feeding
    'feeding.type': 'Type Voeding',
    'feeding.breast': 'Borst',
    'feeding.bottle': 'Fles',
    'feeding.pumping': 'Kolven',
    'feeding.mixed': 'Gemengd',
    'feeding.duration': 'Duur (minuten)',
    'feeding.amount': 'Hoeveelheid (ml)',
    'feeding.breastSide': 'Borst Zijde',
    'feeding.left': 'Links',
    'feeding.right': 'Rechts',
    'feeding.both': 'Beide',

    // Sleep
    'sleep.type': 'Type Slaap',
    'sleep.nap': 'Slaapje',
    'sleep.night': 'Nacht',
    'sleep.startTime': 'Start Tijd',
    'sleep.endTime': 'Eind Tijd',
    'sleep.quality': 'Slaapkwaliteit',
    'sleep.location': 'Slaap Plek',

    // Diaper
    'diaper.type': 'Type',
    'diaper.wet': 'Nat',
    'diaper.dirty': 'Vol',
    'diaper.mixed': 'Gemengd',
    'diaper.amount': 'Hoeveelheid',
    'diaper.color': 'Kleur',
    'diaper.consistency': 'Consistentie',

    // Baby Profile
    'baby.name': 'Naam Baby',
    'baby.dob': 'Geboortedatum',
    'baby.gender': 'Geslacht',
    'baby.boy': 'Jongen',
    'baby.girl': 'Meisje',
    'baby.other': 'Anders',
    'baby.weight': 'Geboortegewicht (kg)',
    'baby.height': 'Geboortelengte (cm)',
    'baby.head': 'Hoofdomtrek (cm)',
    'baby.gestational': 'Zwangerschapsduur (weken)',

    // Milestones
    'milestones.add': 'Mijlpaal Toevoegen',
    'milestones.firstSmile': 'Eerste Glimlach',
    'milestones.firstLaugh': 'Eerste Gelach',
    'milestones.rollingOver': 'Omdraaien',
    'milestones.sittingUp': 'Zitten',
    'milestones.crawling': 'Kruipen',
    'milestones.firstSteps': 'Eerste Stapjes',
    'milestones.firstWords': 'Eerste Woorden',
    'milestones.firstTeeth': 'Eerste Tandjes',

    // Sharing
    'share.title': 'Toegang Delen',
    'share.generateLink': 'Deel Link Maken',
    'share.copyLink': 'Link Kopiëren',
    'share.viewOnly': 'Alleen Kijken',
    'share.viewEdit': 'Kijken & Bewerken',

    // Auth
    'auth.signIn': 'Inloggen',
    'auth.signUp': 'Aanmelden',
    'auth.signOut': 'Uitloggen',
    'auth.email': 'E-mail',
    'auth.password': 'Wachtwoord',
    'auth.google': 'Verder met Google',
    'auth.magicLink': 'Stuur magic link',
  },
} as const;

export type TranslationKey = keyof typeof translations.en;

export function t(key: TranslationKey, locale: Locale = 'en'): string {
  return translations[locale][key] || translations.en[key] || key;
}

export function getLocale(): Locale {
  if (typeof window === 'undefined') return defaultLocale;

  const stored = localStorage.getItem('locale') as Locale | null;
  if (stored && (stored === 'en' || stored === 'nl')) {
    return stored;
  }

  // Try to detect from browser language
  const browserLang = navigator.language.toLowerCase();
  if (browserLang.startsWith('nl')) {
    return 'nl';
  }

  return defaultLocale;
}

export function setLocale(locale: Locale): void {
  localStorage.setItem('locale', locale);
  document.documentElement.lang = locale;
}
