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
  // ⚠️ IMPORTANTE: Reemplaza esto con tu propia API Key de YouTube
  const YOUTUBE_API_KEY = "AIzaSyDnyraLhcVEaPAsjMoB8m9m4wv_BnXpIe8";

  // Creamos la lista doble de canciones locales
  const listaCanciones = new ListaDoble();
  listaCanciones.add("Olvídala Binomio de Oro", "/songs/Olvidala.mp3", "/images/binomio de oro.jpeg");
  listaCanciones.add("Déjala que vuelva", "/songs/dejala que vuelva.mp3", "/images/piso 21.jpeg");
  listaCanciones.add("Un osito dormilón", "/songs/un osito dormilon.mp3", "/images/binomio de oro.jpeg");

  // Canciones recomendadas
  const cancionesRecomendadas = [
    { title: "Olvidala ", artist: "Binomio de Oro", image: "/images/binomio de oro.jpeg" },
    { title: "Suena El Dembow", artist: "Joey Montana", image: "/images/piso 21.jpeg" },

  ];

  // Estado
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

  // Filtra canciones locales según el término de búsqueda
  const filteredSongs = listaCanciones.toArray().filter(song =>
    song.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Función para formatear tiempo en MM:SS
  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Actualizar tiempo actual y duración
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

  // Saltar a un tiempo específico al hacer clic en la barra
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

      // Verificar si hay error en la respuesta
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

  // Reproduce cuando cambia la canción
  useEffect(() => {
    if (audioRef.current && currentSong && !currentSong.videoId) {
      audioRef.current.load();
      setCurrentTime(0);
      setDuration(0);
      if (isPlaying) {
        audioRef.current.play();
      }
    }
  }, [currentSong]);

  // Play / Pause
  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  // Siguiente
  const nextSong = () => {
    if (currentSong && !currentSong.videoId) {
      setCurrentSong(currentSong.next ? currentSong.next : listaCanciones.head);
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
    }
  };

  // Reproducir desde YouTube
  const playYouTubeVideo = (result: YouTubeSearchResult) => {
    const youtubeNode = new Nodo(result.title, "", result.thumbnail, result.id);
    setCurrentSong(youtubeNode);
    setIsPlaying(true);
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
        <h2 style={{ marginBottom: "15px", color: "#333" }}>Lista de Canciones</h2>
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
              {song.title}
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
          REPRODUCTOR
        </h1>
        <h2 style={{ marginBottom: "20px", fontSize: "1.8rem" }}>
          {currentSong?.title || "Sin canción"}
        </h2>

        {/* Reproductor de YouTube o Imagen */}
        {currentSong?.videoId ? (
          <iframe
            width="560"
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
              <label style={{ marginRight: "10px", color: "white" }}>Volumen</label>
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
              />
            </div>
          </>
        )}
      </div>

      {/* Columna derecha - Buscador y Resultados */}
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
              {isSearching ? "Buscando..." : "🔎 Buscar"}
            </button>
          )}
        </div>

        {/* Resultados de YouTube o Recomendadas */}
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
          <h3 style={{ marginBottom: "15px", color: "#333" }}>
            {searchMode === "youtube" && youtubeResults.length > 0 ? "🎵 Resultados" : "⭐ Recomendadas"}
          </h3>
          
          {searchMode === "youtube" && youtubeResults.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {youtubeResults.map((result) => (
                <div
                  key={result.id}
                  onClick={() => playYouTubeVideo(result)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "10px",
                    borderRadius: "10px",
                    cursor: "pointer",
                    transition: "all 0.3s",
                    background: "transparent",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(123, 44, 191, 0.1)";
                    e.currentTarget.style.transform = "scale(1.02)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.transform = "scale(1)";
                  }}
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
                  <div style={{ flex: 1, textAlign: "left" }}>
                    <div style={{ fontWeight: "bold", color: "#333", fontSize: "0.85rem" }}>
                      {result.title.length > 40 ? result.title.substring(0, 40) + "..." : result.title}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "#666" }}>
                      {result.channelTitle}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {cancionesRecomendadas.map((rec, index) => (
                <div
                  key={index}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "10px",
                    borderRadius: "10px",
                    cursor: "pointer",
                    transition: "all 0.3s",
                    background: "transparent",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(123, 44, 191, 0.1)";
                    e.currentTarget.style.transform = "scale(1.02)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.transform = "scale(1)";
                  }}
                >
                  <img
                    src={rec.image}
                    alt={rec.title}
                    style={{
                      width: "50px",
                      height: "50px",
                      borderRadius: "8px",
                      objectFit: "cover",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                    }}
                  />
                  <div style={{ flex: 1, textAlign: "left" }}>
                    <div style={{ fontWeight: "bold", color: "#333", fontSize: "0.95rem" }}>
                      {rec.title}
                    </div>
                    <div style={{ fontSize: "0.85rem", color: "#666" }}>
                      {rec.artist}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;