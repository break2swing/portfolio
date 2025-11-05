export default function MusiquePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Musique</h1>
        <p className="text-muted-foreground">
          Découvrez mes créations musicales
        </p>
      </div>

      <div>
        <h2 className="text-2xl font-semibold mb-6">Morceaux SoundCloud</h2>

        <div className="space-y-6">
          <div className="w-full">
            <iframe
              width="100%"
              height="166"
              scrolling="no"
              frameBorder="no"
              allow="autoplay"
              src="https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/soundcloud%253Atracks%253A2205120907&color=%23217cc6&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true"
            ></iframe>
            <div
              style={{
                fontSize: '10px',
                color: '#cccccc',
                lineBreak: 'anywhere',
                wordBreak: 'normal',
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis',
                fontFamily:
                  'Interstate,Lucida Grande,Lucida Sans Unicode,Lucida Sans,Garuda,Verdana,Tahoma,sans-serif',
                fontWeight: 100,
              }}
            >
              <a
                href="https://soundcloud.com/dkill35"
                title="DKill"
                target="_blank"
                style={{ color: '#cccccc', textDecoration: 'none' }}
              >
                DKill
              </a>{' '}
              ·{' '}
              <a
                href="https://soundcloud.com/dkill35/au-fond-de-mon-coeur"
                title="Au Fond D'Mon Coeur (Prod : DKill)"
                target="_blank"
                style={{ color: '#cccccc', textDecoration: 'none' }}
              >
                Au Fond D&apos;Mon Coeur (Prod : DKill)
              </a>
            </div>
          </div>

          <div className="w-full">
            <iframe
              width="100%"
              height="166"
              scrolling="no"
              frameBorder="no"
              allow="autoplay"
              src="https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/soundcloud%253Atracks%253A2204540815&color=%2345503c&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true"
            ></iframe>
            <div
              style={{
                fontSize: '10px',
                color: '#cccccc',
                lineBreak: 'anywhere',
                wordBreak: 'normal',
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis',
                fontFamily:
                  'Interstate,Lucida Grande,Lucida Sans Unicode,Lucida Sans,Garuda,Verdana,Tahoma,sans-serif',
                fontWeight: 100,
              }}
            >
              <a
                href="https://soundcloud.com/dkill35"
                title="DKill"
                target="_blank"
                style={{ color: '#cccccc', textDecoration: 'none' }}
              >
                DKill
              </a>{' '}
              ·{' '}
              <a
                href="https://soundcloud.com/dkill35/dkill-grand-bleu"
                title="Grand Bleu (Prod Rubz)"
                target="_blank"
                style={{ color: '#cccccc', textDecoration: 'none' }}
              >
                Grand Bleu (Prod Rubz)
              </a>
            </div>
          </div>

          <div className="w-full">
            <iframe
              width="100%"
              height="166"
              scrolling="no"
              frameBorder="no"
              allow="autoplay"
              src="https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/soundcloud%253Atracks%253A2114203944&color=%2345503c&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true"
            ></iframe>
            <div
              style={{
                fontSize: '10px',
                color: '#cccccc',
                lineBreak: 'anywhere',
                wordBreak: 'normal',
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis',
                fontFamily:
                  'Interstate,Lucida Grande,Lucida Sans Unicode,Lucida Sans,Garuda,Verdana,Tahoma,sans-serif',
                fontWeight: 100,
              }}
            >
              <a
                href="https://soundcloud.com/dkill35"
                title="DKill"
                target="_blank"
                style={{ color: '#cccccc', textDecoration: 'none' }}
              >
                DKill
              </a>{' '}
              ·{' '}
              <a
                href="https://soundcloud.com/dkill35/maplume"
                title="Ma Plume (Prod Enigma)"
                target="_blank"
                style={{ color: '#cccccc', textDecoration: 'none' }}
              >
                Ma Plume (Prod Enigma)
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
