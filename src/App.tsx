import { useRef, useState, useEffect } from "react";
import "./App.css";

// Clase Nodo para la lista doble
class Nodo {
  title: string;
  src: string;
  image: string;
  videoId?: string;
  next: Nodo | null = null;
  prev: Nodo | null = null;

  constructor(title: string, src: string, image: string, videoId?: string) {
    this.title = title;
    this.src = src;
    this.image = image;
    this.videoId = videoId;
  }
}

// Clase ListaDoble
class ListaDoble {
  head: Nodo | null = null;
  tail: Nodo | null = null;

  add(title: string, src: string, image: string, videoId?: string) {
    const newNode = new Nodo(title, src, image, videoId);
    if (!this.head) {
      this.head = newNode;
      this.tail = newNode;
    } else {
      this.tail!.next = newNode;
      newNode.prev = this.tail;
      this.tail = newNode;
    }
  }

  // Método para eliminar por título (primera coincidencia)
  remove(title: string) {
    let current = this.head;
    while (current) {
      if (current.title === title) {
        if (current.prev) current.prev.next = current.next;
        if (current.next) current.next.prev = current.prev;
        if (current === this.head) this.head = current.next;
        if (current === this.tail) this.tail = current.prev;
        break;
      }
      current = current.next;
    }
  }

  toArray(): Nodo[] {
    const arr: Nodo[] = [];
    let current = this.head;
    while (current) {
      arr.push(current);
      current = current.next;
    }
    return arr;
  }
}

interface YouTubeSearchResult {
  id: string;
  title: string;
  thumbnail: string;
  channelTitle: string;
}

function App() {
  const YOUTUBE_API_KEY = "AIzaSyDnyraLhcVEaPAsjMoB8m9m4wv_BnXpIe8";

 
  const listaCancionesRef = useRef<ListaDoble | null>(null);
  if (!listaCancionesRef.current) {
    listaCancionesRef.current = new ListaDoble();
    listaCancionesRef.current.add("Olvídala Binomio de Oro", "/songs/Olvidala.mp3", "/images/binomio de oro.jpeg");
    listaCancionesRef.current.add("Déjala que vuelva", "/songs/dejala que vuelva.mp3", "/images/piso 21.jpeg");
    listaCancionesRef.current.add("Un osito dormilón", "/songs/un osito dormilon.mp3", "/images/binomio de oro.jpeg");
  }
  const listaCanciones = listaCancionesRef.current;


  // Estados
  const [playlist, setPlaylist] = useState<Nodo[]>(listaCanciones.toArray());
  const [currentSong, setCurrentSong] = useState<Nodo | null>(listaCanciones.head);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [searchTerm, setSearchTerm] = useState("");
  const [youtubeResults, setYoutubeResults] = useState<YouTubeSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchMode, setSearchMode] = useState<"local" | "youtube">("local");
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Filtra canciones según el término de búsqueda (usa el estado playlist)
  const filteredSongs = playlist.filter(song =>
    song.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Formatear tiempo
  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Efecto para actualizar tiempo y duración del audio
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('durationchange', updateDuration);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('durationchange', updateDuration);
    };
  }, []);

  // Manejo de click en barra de progreso
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const newTime = percent * duration;
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  // Buscar en YouTube
  const searchYouTube = async () => {
    if (!searchTerm.trim()) {
      alert("⚠️ Por favor escribe algo para buscar.");
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=10&q=${encodeURIComponent(
          searchTerm + " music"
        )}&type=video&key=${YOUTUBE_API_KEY}`
      );

      const data = await response.json();

      if (data.error) {
        console.error("Error de YouTube API:", data.error);
        alert(`Error de YouTube API: ${data.error.message}`);
        setIsSearching(false);
        return;
      }

      if (data.items && data.items.length > 0) {
        const results: YouTubeSearchResult[] = data.items.map((item: any) => ({
          id: item.id.videoId,
          title: item.snippet.title,
          thumbnail: item.snippet.thumbnails.medium.url,
          channelTitle: item.snippet.channelTitle,
        }));
        setYoutubeResults(results);
      } else {
        alert("No se encontraron resultados. Intenta con otra búsqueda.");
        setYoutubeResults([]);
      }
    } catch (error) {
      console.error("Error buscando en YouTube:", error);
      alert("Error al buscar en YouTube. Verifica tu conexión a internet y que tu API Key esté correcta.");
    } finally {
      setIsSearching(false);
    }
  };

  // Cuando cambia la canción local, recargar audio
  useEffect(() => {
    const audio = audioRef.current;
    if (audio && currentSong && !currentSong.videoId) {
      audio.load();
      setCurrentTime(0);
      setDuration(0);
  
      // ⚡ volver a escuchar eventos cada vez
      const updateTime = () => setCurrentTime(audio.currentTime);
      const updateDuration = () => setDuration(audio.duration);
  
      audio.addEventListener("timeupdate", updateTime);
      audio.addEventListener("loadedmetadata", updateDuration);
  
      if (isPlaying) {
        audio.play();
      }
  
      return () => {
        audio.removeEventListener("timeupdate", updateTime);
        audio.removeEventListener("loadedmetadata", updateDuration);
      };
    }
  }, [currentSong]);

  // Control Play / Pause
  const togglePlay = () => {
    if (!audioRef.current) return;
    setIsPlaying(!isPlaying);
    if (!isPlaying) {
      setTimeout(() => {
        audioRef.current?.play();
      }, 0);
    } else {
      audioRef.current.pause();
    }
  };
  
  // Siguiente
  const nextSong = () => {
    if (currentSong && !currentSong.videoId) {
      setCurrentSong(currentSong.next ? currentSong.next : listaCanciones.head);
      setIsPlaying(true);
      setTimeout(() => audioRef.current?.play(), 0);
    } else if (currentSong && currentSong.videoId) {
      // si es video de YouTube simplemente quitarlo o pasar a la primera local
      setCurrentSong(listaCanciones.head);
      setIsPlaying(true);
      setTimeout(() => audioRef.current?.play(), 0);
    }
  };

  // Anterior
  const prevSong = () => {
    if (currentSong && !currentSong.videoId) {
      setCurrentSong(currentSong.prev ? currentSong.prev : listaCanciones.tail);
      setIsPlaying(true);
      setTimeout(() => audioRef.current?.play(), 0);
    } else if (currentSong && currentSong.videoId) {
      setCurrentSong(listaCanciones.tail);
      setIsPlaying(true);
      setTimeout(() => audioRef.current?.play(), 0);
    }
  };

  // Reproducir desde YouTube (no lo agrega a la lista por defecto)
  const playYouTubeVideo = (result: YouTubeSearchResult) => {
    const youtubeNode = new Nodo(result.title, "", result.thumbnail, result.id);
    setCurrentSong(youtubeNode);
    setIsPlaying(true);
  };

  // Agregar un resultado (o canción) a la playlist (lista doble)
  const addToPlaylist = (song: { title: string; src: string; image: string; videoId?: string }) => {
    listaCanciones.add(song.title, song.src || "", song.image || "", song.videoId);
    setPlaylist(listaCanciones.toArray());
  };

  // Eliminar de playlist por título
  const removeFromPlaylist = (title: string) => {
    listaCanciones.remove(title);
    const nueva = listaCanciones.toArray();
    setPlaylist(nueva);
    if (currentSong?.title === title) {
      // si borramos la actual, intentar poner la cabeza o null
      setCurrentSong(listaCanciones.head);
      setIsPlaying(false);
    }
  };

  const handleSearch = () => {
    if (searchMode === "youtube") {
      searchYouTube();
    }
  };

  return (
    <div
      className="app-container"
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 2fr 1fr",
        gap: "20px",
        height: "100vh",
        padding: "20px",
        fontFamily: "Playfair Display, serif",
        background: "#f5f5f5",
      }}
    >
      {/* Columna izquierda - Lista de canciones */}
      <div
        className="song-list"
        style={{
          background: "rgba(255,255,255,0.92)",
          padding: "20px",
          borderRadius: "20px",
          overflowY: "auto",
          boxShadow: "0 8px 25px rgba(0,0,0,0.15)",
        }}
      >
        <h2 style={{ marginBottom: "15px", color: "#333" }}>Play List</h2>
        <ul style={{ listStyle: "none", padding: 0 }}>
          {filteredSongs.map((song, index) => (
            <li
              key={index}
              style={{
                cursor: "pointer",
                padding: "10px 15px",
                margin: "5px 0",
                borderRadius: "10px",
                fontWeight: currentSong?.title === song.title ? "bold" : "normal",
                color: currentSong?.title === song.title ? "#9d4edd" : "#222",
                background: currentSong?.title === song.title ? "rgba(157, 78, 221, 0.2)" : "transparent",
                borderLeft: currentSong?.title === song.title ? "4px solid #9d4edd" : "4px solid transparent",
                transition: "all 0.3s",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
              onClick={() => {
                setCurrentSong(song);
                setIsPlaying(true);
                setTimeout(() => audioRef.current?.play(), 0);
              }}
              onMouseEnter={(e) => {
                if (currentSong?.title !== song.title) {
                  e.currentTarget.style.background = "rgba(123, 44, 191, 0.1)";
                  e.currentTarget.style.transform = "translateX(5px)";
                }
              }}
              onMouseLeave={(e) => {
                if (currentSong?.title !== song.title) {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.transform = "translateX(0)";
                }
              }}
            >
              <span style={{ display: "inline-block", marginRight: "12px", flex: 1 }}>{song.title}</span>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  title="Reproducir"
                  onClick={(ev) => {
                    ev.stopPropagation();
                    setCurrentSong(song);
                    setIsPlaying(true);
                    setTimeout(() => audioRef.current?.play(), 0);
                  }}
                >
                  ▶
                </button>
                <button
                  title="Eliminar"
                  onClick={(ev) => {
                    ev.stopPropagation();
                    removeFromPlaylist(song.title);
                  }}
                  style={{ color: "red" }}
                >
                  ❌
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Columna central - Reproductor */}
      <div
        className="player-container"
        style={{
          backgroundImage: currentSong
            ? `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.6)), url(${currentSong.image})`
            : "linear-gradient(135deg, #c77dff, #e0aaff)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          borderRadius: "20px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          color: "white",
          padding: "40px",
          boxShadow: "0 12px 30px rgba(0,0,0,0.2)",
        }}
      >
        <h1 className="titulo" style={{ marginBottom: "10px", fontSize: "6rem" }}>
          XSOUND
        </h1>
        <h2 style={{ marginBottom: "20px", fontSize: "1.8rem" }}>
          {currentSong?.title || "Sin canción"}
        </h2>

        {/* Reproductor de YouTube o Imagen */}
        {currentSong?.videoId ? (
          <iframe
            width="360"
            height="315"
            src={`https://www.youtube.com/embed/${currentSong.videoId}?autoplay=1`}
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{
              borderRadius: "15px",
              boxShadow: "0 6px 15px rgba(0,0,0,0.4)",
              marginBottom: "20px",
            }}
          ></iframe>
        ) : (
          currentSong?.image && (
            <div
              style={{
                width: "250px",
                height: "250px",
                borderRadius: "15px",
                overflow: "hidden",
                boxShadow: "0 6px 15px rgba(0,0,0,0.4)",
                marginBottom: "20px",
              }}
            >
              <img
                src={currentSong.image}
                alt={currentSong.title}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            </div>
          )
        )}

        {/* Audio oculto (solo para canciones locales) */}
        {!currentSong?.videoId && (
          <audio ref={audioRef} controls style={{ display: "none" }}>
            <source src={currentSong?.src} type="audio/mp3" />
          </audio>
        )}

        {/* Botones - solo para canciones locales */}
        {!currentSong?.videoId && (
          <>
            {/* Barra de progreso */}
            <div style={{ width: "100%", maxWidth: "500px", marginBottom: "15px" }}>
              <div
                onClick={handleProgressClick}
                style={{
                  width: "100%",
                  height: "8px",
                  background: "rgba(255,255,255,0.3)",
                  borderRadius: "10px",
                  cursor: "pointer",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${duration ? (currentTime / duration) * 100 : 0}%`,
                    height: "100%",
                    background: "linear-gradient(90deg, #9d4edd, #c77dff)",
                    borderRadius: "10px",
                    transition: "width 0.1s linear",
                  }}
                />
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginTop: "8px",
                  fontSize: "0.9rem",
                  color: "rgba(255,255,255,0.9)",
                }}
              >
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            <div style={{ marginTop: "10px" }}>
              <button
                style={{
                  background: "#7b2cbf",
                  color: "white",
                  border: "none",
                  padding: "10px 20px",
                  margin: "0 5px",
                  borderRadius: "50px",
                  cursor: "pointer",
                  fontSize: "1rem",
                }}
                onClick={prevSong}
              >
                ⏮️ Anterior
              </button>
              <button
                style={{
                  background: "#7b2cbf",
                  color: "white",
                  border: "none",
                  padding: "10px 20px",
                  margin: "0 5px",
                  borderRadius: "50px",
                  cursor: "pointer",
                  fontSize: "1rem",
                }}
                onClick={togglePlay}
              >
                {isPlaying ? "⏸️ Pausar" : "▶️ Reproducir"}
              </button>
              <button
                style={{
                  background: "#7b2cbf",
                  color: "white",
                  border: "none",
                  padding: "10px 20px",
                  margin: "0 5px",
                  borderRadius: "50px",
                  cursor: "pointer",
                  fontSize: "1rem",
                }}
                onClick={nextSong}
              >
                ⏭️ Siguiente
              </button>
            </div>

            {/* Barra de volumen */}
            <div
              style={{
                marginTop: "18px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <label style={{ marginRight: "10px", color: "White" }}>Volumen</label>
              <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={volume}
                  onChange={(e) => {
                    const vol = parseFloat(e.target.value);
                    setVolume(vol);
                    if (audioRef.current) audioRef.current.volume = vol;
                  }}
                  className="volume-slider"
                  style={{
                    background: `linear-gradient(to right, #9d4edd ${volume * 100}%, white ${volume * 100}%)`
                  }}
                />
            </div>
          </>
        )}
      </div>

      {/* Columna derecha - Buscador y Playlist */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "20px",
        }}
      >
        {/* Buscador */}
        <div
          style={{
            background: "rgba(255,255,255,0.92)",
            padding: "20px",
            borderRadius: "20px",
            boxShadow: "0 8px 25px rgba(0,0,0,0.15)",
          }}
        >
          <h3 style={{ marginBottom: "10px", color: "#333" }}>🔍 Buscar Música</h3>

          {/* Selector de modo */}
          <div style={{ marginBottom: "10px", display: "flex", gap: "10px" }}>
            <button
              onClick={() => setSearchMode("local")}
              style={{
                flex: 1,
                padding: "8px",
                borderRadius: "8px",
                border: "none",
                background: searchMode === "local" ? "#7b2cbf" : "#e0aaff",
                color: searchMode === "local" ? "white" : "#333",
                cursor: "pointer",
                fontSize: "0.9rem",
              }}
            >
              📁 Local
            </button>
            <button
              onClick={() => setSearchMode("youtube")}
              style={{
                flex: 1,
                padding: "8px",
                borderRadius: "8px",
                border: "none",
                background: searchMode === "youtube" ? "#7b2cbf" : "#e0aaff",
                color: searchMode === "youtube" ? "white" : "#333",
                cursor: "pointer",
                fontSize: "0.9rem",
              }}
            >
              ▶️ YouTube
            </button>
          </div>

          <input
            type="text"
            placeholder={searchMode === "local" ? "Buscar en tus canciones..." : "Buscar en YouTube..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSearch()}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: "10px",
              border: "2px solid #9d4edd",
              fontSize: "1rem",
              outline: "none",
              marginBottom: "10px",
              boxSizing: "border-box",
            }}
          />

          {searchMode === "youtube" && (
            <button
              onClick={handleSearch}
              disabled={isSearching}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "10px",
                border: "none",
                background: "#7b2cbf",
                color: "white",
                cursor: isSearching ? "not-allowed" : "pointer",
                fontSize: "1rem",
              }}
            >
              {isSearching ? "Buscando..." : "Buscar"}
            </button>
          )}
        </div>

        {/* Resultados de YouTube o Playlist */}
        <div
          style={{
            background: "rgba(255,255,255,0.92)",
            padding: "20px",
            borderRadius: "20px",
            boxShadow: "0 8px 25px rgba(0,0,0,0.15)",
            overflowY: "auto",
            flex: 1,
          }}
        >
          {/* Si estás en modo youtube y hay resultados, muéstralos arriba */}
          {searchMode === "youtube" && youtubeResults.length > 0 && (
            <>
              <h3 style={{ marginBottom: "15px", color: "#333" }}>🎵 Resultados</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "18px" }}>
                {youtubeResults.map((result) => (
                  <div
                    key={result.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      padding: "10px",
                      borderRadius: "10px",
                      cursor: "pointer",
                      transition: "all 0.3s",
                      background: "transparent",
                      justifyContent: "space-between",
                    }}
                  >
                    <div
                      style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1 }}
                      onClick={() => playYouTubeVideo(result)}
                    >
                      <img
                        src={result.thumbnail}
                        alt={result.title}
                        style={{
                          width: "60px",
                          height: "45px",
                          borderRadius: "8px",
                          objectFit: "cover",
                          boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                        }}
                      />
                      <div style={{ textAlign: "left" }}>
                        <div style={{ fontWeight: "bold", color: "#333", fontSize: "0.85rem" }}>
                          {result.title.length > 40 ? result.title.substring(0, 40) + "..." : result.title}
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "#666" }}>{result.channelTitle}</div>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: "8px", marginLeft: "12px" }}>
                      <button
                        title="Agregar a playlist"
                        onClick={() =>
                          addToPlaylist({ title: result.title, src: "", image: result.thumbnail, videoId: result.id })
                        }
                      >
                        ➕
                      </button>
                      <button title="Reproducir" onClick={() => playYouTubeVideo(result)}>
                        ▶
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}


        </div>
      </div>
    </div>
  );
}

export default App;
