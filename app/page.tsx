import Link from 'next/link';
import { Music, Image, Video, FileText, Code } from 'lucide-react';

const sections = [
  {
    href: '/musique',
    icon: Music,
    title: 'Musique',
    description: 'Découvrez mes compositions et morceaux sur SoundCloud',
    iconColor: 'text-blue-500',
  },
  {
    href: '/photo',
    icon: Image,
    title: 'Photo',
    description: 'Ma galerie de photographies et créations visuelles',
    iconColor: 'text-green-500',
  },
  {
    href: '/video',
    icon: Video,
    title: 'Video',
    description: 'Mes projets vidéo et créations audiovisuelles',
    iconColor: 'text-red-500',
  },
  {
    href: '/texte',
    icon: FileText,
    title: 'Texte',
    description: 'Mes écrits, articles et créations littéraires',
    iconColor: 'text-orange-500',
  },
  {
    href: '/application',
    icon: Code,
    title: 'Application',
    description: 'Mes projets de développement et applications web',
    iconColor: 'text-purple-500',
  },
];

export default function Home() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Bienvenue sur mon portfolio</h1>
        <p className="text-muted-foreground max-w-3xl leading-relaxed">
          Explorez mes différentes créations à travers la musique, la photographie, la vidéo, l&apos;écriture et le développement d&apos;applications. Chaque section présente mes projets et mon univers créatif.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mt-8">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <Link key={section.href} href={section.href}>
              <div className="group relative overflow-hidden rounded-lg border bg-card p-6 hover:shadow-md transition-all cursor-pointer">
                <div className="flex items-start gap-4">
                  <div className={`${section.iconColor}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <h3 className="font-semibold text-lg text-foreground group-hover:text-foreground/90">
                      {section.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {section.description}
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
