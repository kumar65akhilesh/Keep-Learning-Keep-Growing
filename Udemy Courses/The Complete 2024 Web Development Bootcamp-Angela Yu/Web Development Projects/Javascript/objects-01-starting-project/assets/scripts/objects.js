const addMovie = document.getElementById("add-movie-btn");
const searchMovie = document.getElementById("search-btn");
const title = document.getElementById("title");
const extraName = document.getElementById("extra-name");
const extraValue = document.getElementById("extra-value");
const filterTitle = document.getElementById("filter-title");
const movies = [];
const ul = document.getElementById("movie-list");

addMovie.addEventListener("click", addMovieHandler);
searchMovie.addEventListener("click", searchMovieHandler);

function addMovieHandler() {
    const movie = {
        movieName: title.value,
        [extraName.value]: extraValue.value
    };
    movies.push(movie);
    const li = document.createElement("li");
    li.textContent = movie.movieName + " - " + movie[extraName.value];
    ul.appendChild(li);
    ul.classList.add("visible");
    title.value = "";
    extraName.value="";
    extraValue.value="";    
} 

function searchMovieHandler() {
    const input = filterTitle.value.toLowerCase();
    for(const movie of movies) {
        if(movie.movieName.toLowerCase().indexOf(input) > -1) {
            console.log("found movie");
            return;
        }
    }
    console.log("not found");
}