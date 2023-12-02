import { useEffect, useRef, useState } from "react";
import StarRating from './StarRating';
import { useMovies } from './useMovies';

const average = (arr) =>
  arr.reduce((acc, cur, i, arr) => acc + cur / arr.length, 0);

const Key = "64269e99";


export default function App() {
  const [query, setQuery] = useState("");
  const [selectedID, setSelectedID] = useState(null);

  // const [watched, setWatched] = useState([]);
  const [watched, setWatched] = useState(function () {
    const stored = localStorage.getItem('watched');

    return JSON.parse(stored);
  });

  const { movies, isLoading, error } = useMovies(query);

  function handleSelectMovie(id) {
    setSelectedID((selectedID) => id === selectedID ? null : id);
  }

  function handleCloseMovie() {
    setSelectedID(null);
  }

  function handleAddWatched(movie) {
    setWatched(watched => [...watched, movie]);

    // localStorage.setItem('watched', JSON.stringify([...watched, movie]));
  }

  function handleDeleteMovie(id) {
    setWatched(watched => watched.filter(movie => movie.imdbID !== id));
  }



  useEffect(function () {
    localStorage.setItem('watched', JSON.stringify(watched));

  }, [watched]);


  return (
    <>
      <Navbar movies={movies}>
        <Logo />
        <Search query={query} setQuery={setQuery} />
        <NumResults movies={movies} />
      </Navbar>

      <Main >

        <Box >
          {/* {isLoading ? <Loader /> : <MovieList movies={movies} />} */}
          {isLoading && <Loader />}
          {!isLoading && !error && <MovieList movies={movies} onSelectMovie={handleSelectMovie} />}
          {error && <ErrorMessage message={error} />}
        </Box>

        <Box>
          {selectedID ?
            <MovieDetails
              selectedID={selectedID}
              onCloseMovie={handleCloseMovie}
              onAddWatched={handleAddWatched}
              watched={watched}
            /> :
            <>
              {<WatchedSummary watched={watched} />}
              <WatchedMovieList watched={watched} onDeleteMovie={handleDeleteMovie} />
            </>
          }
        </Box>

      </Main>

    </>
  );
}

function Loader() {
  return <p className="loader">loading...</p>;
}


function ErrorMessage({ message }) {
  return <p className="error">
    <span>⛔ </span>
    {message}
  </p>;
}

function Navbar({ children }) {

  return (
    <nav className="nav-bar">
      {children}
    </nav>
  );
}

function Logo() {
  return <div className="logo">
    <span role="img">🍿</span>
    <h1>usePopcorn</h1>
  </div>;
}

function Search({ query, setQuery }) {
  const inputEl = useRef(null);

  // new Effect runs on mount
  useEffect(function () {

    function callback(e) {
      if (document.activeElement === inputEl.current) return;

      if (e.code === "Enter") {
        inputEl.current.focus();
        setQuery("");
      }
    }

    document.addEventListener('keydown', callback);

    return () => document.addEventListener('keydown', callback);
  }, [setQuery]);


  return (
    <input
      className="search"
      type="text"
      placeholder="Search movies..."
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      ref={inputEl}
    />);
}

function NumResults({ movies }) {
  return <p className="num-results">
    Found <strong>{movies.length}</strong> results
  </p>;
}




function Main({ children }) {

  return (
    <main className="main">
      {children}
    </main>
  );
}


function Box({ children }) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="box">
      <button
        className="btn-toggle"
        onClick={() => setIsOpen((open) => !open)}
      >
        {isOpen ? "–" : "+"}
      </button>
      {isOpen && (children)}
    </div>
  );
}

/*
function WatchedBox() {
  const [watched, setWatched] = useState(tempWatchedData);
  const [isOpen2, setIsOpen2] = useState(true);

  return <div className="box">
    <button
      className="btn-toggle"
      onClick={() => setIsOpen2((open) => !open)}
    >
      {isOpen2 ? "–" : "+"}
    </button>
    {isOpen2 && (
      <>
        <WatchedSummary watched={watched} />
        <WatchedMovieList watched={watched} />
      </>
    )}
  </div>;
}
*/

function MovieList({ movies, onSelectMovie }) {

  return (
    <ul className="list list-movies">
      {movies?.map((movie) => (
        <Movie movie={movie} key={movie.imdbID} onSelectMovie={onSelectMovie} />
      ))}
    </ul>
  );
}

function Movie({ movie, onSelectMovie }) {
  return (
    <li onClick={() => onSelectMovie(movie.imdbID)}>
      <img src={movie.Poster} alt={`${movie.Title} poster`} />
      <h3>{movie.Title}</h3>
      <div>
        <p>
          <span>🗓</span>
          <span>{movie.Year}</span>
        </p>
      </div>
    </li>
  );
}


function MovieDetails({ selectedID, onCloseMovie, onAddWatched, watched }) {

  const [movie, setMovie] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [userRating, setUserRating] = useState('');
  const countRef = useRef(0);

  const isWatched = watched.map((movie) => movie.imdbID).includes(selectedID);
  const watchedUserRating = watched.find((movie) => movie.imdbID === selectedID)?.userRating;
  // destruct data out of movie
  const {
    Title: title,
    Year: year,
    Poster: poster,
    Runtime: runtime,
    Ratings: rartings,
    imdbRating,
    Plot: plot,
    Released: released,
    Actors: actors,
    Director: director,
    Genre: genre
  } = movie;

  function handleAdd() {
    const newWatchedMovie = {
      imdbID: selectedID,
      title,
      year,
      poster,
      imdbRating: Number(imdbRating),
      runtime: Number(runtime.split(" ").at(0)),
      userRating,
      countRatingDecisions: countRef.current
    };

    onAddWatched(newWatchedMovie);
    onCloseMovie();
  }

  // every time the component renders thats why the empty dependency array
  useEffect(function () {

    async function getMovieDetails() {
      setIsLoading(true);
      const res = await fetch(`http://www.omdbapi.com/?apikey=${Key}&i=${selectedID}`);
      const data = await res.json();

      setMovie(data);
      setIsLoading(false);
    }

    getMovieDetails();
  }, [selectedID]);

  // change app title every time this component mounts
  useEffect(function () {
    if (!title) return;
    document.title = `Movie: ${title}`;

    return function () {
      document.title = 'usePopcorn';
    };
  }, [title]);

  useEffect(function () {
    function callback(e) {
      if (e.code === "Escape") {
        onCloseMovie();
      }
    }
    document.addEventListener('keydown', callback);

    return function () {
      document.removeEventListener('keydown', callback);
    };
  }, [onCloseMovie]);

  // because we are not allowed to mutate the Ref in render logic
  useEffect(function () {
    if (userRating) {
      countRef.current++;
    }
  }, [userRating]);

  return (
    <div className="details">
      {isLoading ? <Loader /> :
        <>
          <header>
            <button className="btn-back" onClick={onCloseMovie}>⬅</button>
            <img src={poster} alt="Movie Poster" />
            <div className="details-overview">
              <h2>{title}</h2>
              <p>{released} &bull; {runtime}</p>
              <p>{genre}</p>
              <p><span>⭐</span>{imdbRating} on IMDB</p>
            </div>
          </header>

          <section>
            <div className="rating">
              {!isWatched ? <>
                <StarRating maxRating={10} size={24} onSetRating={setUserRating} />

                {userRating > 0 && (
                  <button className="btn-add" onClick={handleAdd}>+Add movie to list</button>)
                }
              </>
                :
                <p>You rated this movie {watchedUserRating}⭐</p>
              }
            </div>

            <p><em>{plot}</em></p>
            <p>starring {actors}</p>
            <p>Directed by {director}</p>
          </section>
        </>
      }
    </div>

  );
}



function WatchedSummary({ watched }) {

  const avgImdbRating = average(watched.map((movie) => movie.imdbRating)).toFixed(1);
  const avgUserRating = average(watched.map((movie) => movie.userRating)).toFixed(1);
  const avgRuntime = average(watched.map((movie) => movie.runtime)).toFixed(1);

  return (
    <div className="summary">
      <h2>Movies you watched</h2>
      <div>
        <p>
          <span>#️⃣</span>
          <span>{watched.length} movies</span>
        </p>
        <p>
          <span>⭐️</span>
          <span>{avgImdbRating}</span>
        </p>
        <p>
          <span>🌟</span>
          <span>{avgUserRating}</span>
        </p>
        <p>
          <span>⏳</span>
          <span>{avgRuntime} min</span>
        </p>
      </div>
    </div>
  );
}

function WatchedMovieList({ watched, onDeleteMovie }) {


  return (

    <ul className="list">
      {watched.map((movie) => (
        <WatchedMovie movie={movie} key={movie.imdbID} onDeleteMovie={onDeleteMovie} />
      ))}
    </ul>
  );
}

function WatchedMovie({ movie, onDeleteMovie }) {

  function handleDelete() {
    onDeleteMovie(movie.imdbID);
  }

  return (
    <li key={movie.imdbID}>
      <img src={movie.poster} alt={`${movie.title} poster`} />
      <h3>{movie.title}</h3>
      <div>
        <p>
          <span>⭐️</span>
          <span>{movie.imdbRating}</span>
        </p>
        <p>
          <span>🌟</span>
          <span>{movie.userRating}</span>
        </p>
        <p>
          <span>⏳</span>
          <span>{movie.runtime} min</span>
        </p>

        <button className="btn-delete" onClick={handleDelete}>❌</button>
      </div>
    </li>
  );
}