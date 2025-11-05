import { Video } from 'lucide-react';

export default function VideosPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
      <div className="p-6 rounded-full bg-muted">
        <Video className="h-12 w-12 text-muted-foreground" />
      </div>
      <h1 className="text-3xl font-bold">Vidéos</h1>
      <p className="text-xl text-muted-foreground text-center max-w-md">
        Section en cours de création
      </p>
      <p className="text-sm text-muted-foreground text-center max-w-md">
        Cette section sera bientôt disponible et présentera mes créations vidéo.
      </p>
    </div>
  );
}
