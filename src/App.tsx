import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import "./App.css";

class Nodo {
  title: string;
  src: string;
  image: string;
  videoId: string | undefined;
  next: Nodo | null = null;
  prev: Nodo | null = null;

  constructor(
    title: string,
    src: string,
    image: string,
    videoId?: string,
  ) {
    this.title = title;
    this.src = src;
    this.image = image;
    this.videoId = videoId;
  }
}

class ListaDoble {
  head: Nodo | null = null;
  tail: Nodo | null = null;

  add(title: string, src: string, image: string, videoId?: string) {
    const node = new Nodo(title, src, image, videoId);
    if (!this.head) this.head = this.tail = node;
    else {
      node.prev = this.tail;
      this.tail!.next = node;
      this.tail = node;
    }
  }

  remove(target: Nodo) {
    let node = this.head;
    while (node) {
      if (node === target) {
        if (node.prev) node.prev.next = node.next;
        else this.head = node.next;
        if (node.next) node.next.prev = node.prev;
        else this.tail = node.prev;
        return;
      }
      node = node.next;
    }
  }

  toArray() {
    const songs: Nodo[] = [];
    let node = this.head;
    while (node) {
      songs.push(node);
      node = node.next;
    }
    return songs;
  }
}

interface YouTubeSearchResult {
  id: string;
  title: string;
  thumbnail: string;
  channelTitle: string;
}

function Icon({ name, size = 20 }: { name: string; size?: number }) {
  const paths: Record<string, ReactNode> = {
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    play: <path d="m8 5 12 7-12 7z" fill="currentColor" stroke="none" />,
    pause: <><path d="M8 5h3v14H8z" fill="currentColor" stroke="none" /><path d="M15 5h3v14h-3z" fill="currentColor" stroke="none" /></>,
    next: <><path d="m5 5 10 7-10 7z" fill="currentColor" stroke="none" /><path d="M19 5v14" /></>,
    previous: <><path d="m19 5-10 7 10 7z" fill="currentColor" stroke="none" /><path d="M5 5v14" /></>,
    plus: <><path d="M12 5v14M5 12h14" /></>,
    close: <><path d="m6 6 12 12M18 6 6 18" /></>,
    heart: <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z" />,
    music: <><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></>,
    volume: <><path d="M11 5 6 9H3v6h3l5 4z" /><path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14" /></>,
  };
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

function App() {
  const playlistRef = useRef<ListaDoble | null>(null);
  if (!playlistRef.current) {
    playlistRef.current = new ListaDoble();
    playlistRef.current.add("Olvídala · Binomio de Oro", "/songs/Olvidala.mp3", "/images/binomio de oro.jpeg");
    playlistRef.current.add("Déjala que vuelva · Piso 21", "/songs/dejala que vuelva.mp3", "/images/piso 21.jpeg");
    playlistRef.current.add("Un osito dormilón · Binomio de Oro", "/songs/un osito dormilon.mp3", "/images/binomio de oro.jpeg");
  }
  const playlistRefValue = playlistRef.current;
  const [playlist, setPlaylist] = useState(playlistRefValue.toArray());
  const [currentSong, setCurrentSong] = useState<Nodo | null>(playlistRefValue.head);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.65);
  const [librarySearch, setLibrarySearch] = useState("");
  const [youtubeQuery, setYoutubeQuery] = useState("");
  const [youtubeResults, setYoutubeResults] = useState<YouTubeSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [searchError, setSearchError] = useState("");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const filteredSongs = playlist.filter((song) => song.title.toLowerCase().includes(librarySearch.toLowerCase()));

  const formatTime = (seconds: number) => {
    if (!Number.isFinite(seconds)) return "0:00";
    return `${Math.floor(seconds / 60)}:${Math.floor(seconds % 60).toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || currentSong?.videoId) return;
    audio.load();
    setCurrentTime(0);
    setDuration(0);
  }, [currentSong]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = volume;
  }, [volume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || currentSong?.videoId) return;
    if (isPlaying) void audio.play().catch(() => setIsPlaying(false));
    else audio.pause();
  }, [isPlaying, currentSong]);

  const playSong = (song: Nodo) => {
    setCurrentSong(song);
    setIsPlaying(true);
  };

  const togglePlay = () => {
    if (currentSong?.videoId) {
      setIsPlaying((playing) => !playing);
      return;
    }
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      void audio.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    }
  };

  const changeTrack = (direction: "next" | "previous") => {
    if (!currentSong || !playlist.length) return;
    if (currentSong.videoId) {
      playSong(direction === "next" ? (playlistRefValue.head ?? playlist[0]) : (playlistRefValue.tail ?? playlist[playlist.length - 1]));
      return;
    }
    const next = direction === "next" ? currentSong.next ?? playlistRefValue.head : currentSong.prev ?? playlistRefValue.tail;
    if (next) playSong(next);
  };

  const searchYouTube = async () => {
    if (!youtubeQuery.trim()) return;
    setIsSearching(true);
    setSearchError("");
    try {
      const key = import.meta.env.VITE_YOUTUBE_API_KEY;
      if (!key) throw new Error("Configura VITE_YOUTUBE_API_KEY para buscar en YouTube.");
      const params = new URLSearchParams({
        part: "snippet",
        maxResults: "10",
        type: "video",
        videoCategoryId: "10",
        q: youtubeQuery.trim(),
        key,
      });
      const response = await fetch(`https://www.googleapis.com/youtube/v3/search?${params}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message ?? "No se pudo completar la búsqueda.");
      const results: YouTubeSearchResult[] = (data.items ?? []).map((item: any) => ({
        id: item.id.videoId,
        title: item.snippet.title,
        thumbnail: item.snippet.thumbnails.medium.url,
        channelTitle: item.snippet.channelTitle,
      }));
      setYoutubeResults(results);
      if (!results.length) setSearchError("No encontramos resultados. Prueba con otra búsqueda.");
    } catch (error) {
      setSearchError(error instanceof Error ? error.message : "No se pudo conectar con YouTube.");
      setYoutubeResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const removeFromPlaylist = (song: Nodo) => {
    const wasCurrent = currentSong === song;
    playlistRefValue.remove(song);
    const updated = playlistRefValue.toArray();
    setPlaylist(updated);
    if (wasCurrent) {
      setCurrentSong(updated[0] ?? null);
      setIsPlaying(false);
    }
  };

  const seek = (value: number) => {
    if (!audioRef.current || !duration) return;
    audioRef.current.currentTime = value;
    setCurrentTime(value);
  };

  const activeImage = currentSong?.image;
  const isFavorite = currentSong ? favorites.includes(currentSong.title) : false;

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#inicio" aria-label="XSOUND, inicio"><span className="brand-mark"><Icon name="music" size={18} /></span><span>XSOUND<span className="brand-period">.</span></span></a>
        <div className="topbar-note">Tu espacio para escuchar</div>
      </header>

      <div className="workspace" id="inicio">
        <aside className="library panel">
          <div className="section-heading">
            <div><p className="eyebrow">TU COLECCIÓN</p><h2>Biblioteca</h2></div>
            <span className="count-pill">{playlist.length.toString().padStart(2, "0")}</span>
          </div>
          <label className="search-field library-search"><Icon name="search" size={18} /><input aria-label="Filtrar biblioteca descargada" placeholder="Filtrar descargas" value={librarySearch} onChange={(event) => setLibrarySearch(event.target.value)} /><kbd>/</kbd></label>
          <div className="list-label"><span>EN LA COLA</span><span>{filteredSongs.length} pistas</span></div>
          <ul className="track-list">
            {filteredSongs.map((song, index) => (
              <li key={`${song.title}-${index}`} className={`track-row ${currentSong === song ? "is-active" : ""}`}>
                <button className="track-main" onClick={() => playSong(song)} aria-label={`Reproducir ${song.title}`}>
                  <span className="track-cover"><img src={song.image} alt="" /></span>
                  <span className="track-copy"><span className="track-title">{song.title.split(" · ")[0]}</span><span className="track-subtitle">{song.title.split(" · ")[1] ?? "Tu biblioteca"}</span></span>
                </button>
                <button className="icon-button remove-button" title={`Quitar ${song.title}`} aria-label={`Quitar ${song.title}`} onClick={() => removeFromPlaylist(song)}><Icon name="close" size={17} /></button>
              </li>
            ))}
            {!filteredSongs.length && <li className="empty-state">No hay canciones para mostrar.</li>}
          </ul>
          <div className="library-foot"><span className="library-foot-icon"><Icon name="music" size={15} /></span><span>Hecho para escuchar con calma</span></div>
        </aside>

        <section className="player panel" aria-label="Reproductor">
          <div className="player-glow" />
          <div className="player-header"><span className="eyebrow">AHORA SUENA</span></div>
          <div className={`album-art ${currentSong?.videoId ? "video-art" : ""}`}>
            {currentSong?.videoId ? <iframe src={`https://www.youtube.com/embed/${currentSong.videoId}?autoplay=${isPlaying ? 1 : 0}`} title={`Reproductor de ${currentSong.title}`} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen /> : activeImage ? <img src={activeImage} alt={`Portada de ${currentSong?.title}`} /> : <div className="art-placeholder"><Icon name="music" size={60} /></div>}
          </div>
          <div className="now-playing"><div className="song-heading"><div><h1>{currentSong?.title.split(" · ")[0] ?? "Elige una canción"}</h1><p className="artist-name">{currentSong?.title.split(" · ")[1] ?? "Tu música, a tu manera"}</p></div><button className={`favorite-button ${isFavorite ? "is-favorite" : ""}`} aria-label={isFavorite ? "Quitar de favoritos" : "Añadir a favoritos"} aria-pressed={isFavorite} title={isFavorite ? "Quitar de favoritos" : "Añadir a favoritos"} disabled={!currentSong} onClick={() => currentSong && setFavorites((saved) => isFavorite ? saved.filter((title) => title !== currentSong.title) : [...saved, currentSong.title])}><Icon name="heart" size={17} /></button></div>
            {!currentSong?.videoId && <div className="timeline"><input aria-label="Posición de reproducción" type="range" min="0" max={duration || 0} step="0.1" value={Math.min(currentTime, duration || 0)} style={{ "--progress": `${duration ? (currentTime / duration) * 100 : 0}%` } as CSSProperties} onChange={(event) => seek(Number(event.target.value))} /><div className="time-labels"><span>{formatTime(currentTime)}</span><span>{formatTime(duration)}</span></div></div>}
            <div className="player-controls"><button className="transport-button" aria-label="Pista anterior" onClick={() => changeTrack("previous")}><Icon name="previous" /></button><button className="play-button" aria-label={isPlaying ? "Pausar" : "Reproducir"} onClick={togglePlay}><Icon name={isPlaying ? "pause" : "play"} size={22} /></button><button className="transport-button" aria-label="Siguiente pista" onClick={() => changeTrack("next")}><Icon name="next" /></button><div className="volume-control"><Icon name="volume" size={18} /><input aria-label="Volumen" type="range" min="0" max="1" step="0.01" value={volume} style={{ "--progress": `${volume * 100}%` } as CSSProperties} onChange={(event) => setVolume(Number(event.target.value))} /></div></div>
          </div>
          {!currentSong?.videoId && currentSong && <audio ref={audioRef} src={currentSong.src} onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)} onLoadedMetadata={(event) => setDuration(event.currentTarget.duration)} onEnded={() => changeTrack("next")} onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)} />}
        </section>

        <aside className="discover panel">
          <div className="section-heading discover-heading"><div><p className="eyebrow">EXPLORAR</p><h2>YouTube</h2></div><span className="discover-symbol"><Icon name="search" size={19} /></span></div>
          <form className="discover-search" onSubmit={(event) => { event.preventDefault(); void searchYouTube(); }}>
            <label className="search-field"><Icon name="search" size={18} /><input aria-label="Buscar en YouTube" placeholder="Artista o canción" value={youtubeQuery} onChange={(event) => { setYoutubeQuery(event.target.value); setSearchError(""); }} /></label>
            <button className="search-submit" type="submit" disabled={isSearching || !youtubeQuery.trim()}>{isSearching ? "Buscando…" : "Buscar"}</button>
          </form>
          <div className="results-heading"><span>RESULTADOS</span><span>{youtubeResults.length ? `${youtubeResults.length} VIDEOS` : "YOUTUBE"}</span></div>
          <div className="discover-results">
            {searchError && <p className="inline-message">{searchError}</p>}
            {youtubeResults.map((result) => <article className="result-row" key={result.id}><button className="result-main" onClick={() => playSong(new Nodo(result.title, "", result.thumbnail, result.id))}><img src={result.thumbnail} alt="" /><span><strong>{result.title}</strong><small>{result.channelTitle}</small></span></button></article>)}
            {!youtubeResults.length && !searchError && <div className="discover-empty"><span className="empty-art"><Icon name="music" size={24} /></span><strong>Busca música en YouTube</strong><p>Los resultados aparecerán aquí.</p></div>}
          </div>
          <div className="discover-foot"><span>YouTube</span><span className="foot-line" /></div>
        </aside>
      </div>
    </main>
  );
}

export default App;
