//document.getElementById("add-modal").classList.toggle("visible");

const header = document.querySelector("header");
const addMovieBtn = header.querySelector("button");
const modalActions = document.querySelector(".modal__actions");
const cancelBtn = modalActions.querySelector(".btn--passive");
const addBtn = modalActions.querySelector(".btn--success");
const ul = document.getElementById("movie-list");
const movieName = document.getElementById("title");
const img_url = document.getElementById("image-url");
const rating = document.getElementById("rating");
const backdrop = document.getElementById("backdrop");
const deleteModal = document.getElementById("delete-modal");

const movies = [];
let cnt=0;


addMovieBtn.addEventListener("click", () => {
  backdroptoggle();
  document.getElementById("add-modal").classList.toggle("visible");
});

const displaySectionOrMovies = () => {
    if(movies.length > 0) {
        document.getElementById("entry-text").style.display = "none";
    } else {
        document.getElementById("entry-text").style.display = "block";
    }
}

const clearInputs = () => {
  img_url.value = "";
  rating.value = "";
  movieName.value = "";
};

cancelBtn.addEventListener("click", () => {
  backdroptoggle();
  document.getElementById("add-modal").classList.remove("visible");
  clearInputs();
  displaySectionOrMovies();
});



const backdroptoggle = () => {
  backdrop.classList.toggle("visible");
};



const deletMovie = (id) => {
    let cnt = 0;
    let index = -1;
    for(const obj of movies) {        
        if(obj.id == id) {
            index = cnt;
        }
        cnt++;
    }
    if(index > -1) {
        movies.pop(index);
    }
    document.getElementById(id).remove();
    displaySectionOrMovies();
}
const noBtnHandler = ()=>{  
    backdroptoggle();  
    deleteModal.classList.remove("visible");
};
const yesBtnHandler = (id)=>{
    deletMovie(id);
    backdroptoggle();
    deleteModal.classList.remove("visible");
}
const handleDelete = (id) => {
    //const returnVal = areYouSure(id);   
    let yesBtn = document.querySelector(".btn--danger");
    const noBtn =document.querySelectorAll(".btn--passive")[1]; 
    backdroptoggle();   
    deleteModal.classList.add("visible");
    noBtn.removeEventListener("click", noBtnHandler);
    noBtn.addEventListener("click",noBtnHandler);
    yesBtn.replaceWith(yesBtn.cloneNode(true));
    yesBtn = document.querySelector(".btn--danger");
    yesBtn.addEventListener("click",yesBtnHandler.bind(null, id));
};

addBtn.addEventListener("click", () => {
  const newLi = document.createElement("li");
  newLi.className = "movie-element";
  
  console.log(movieName.value, img_url.value, rating.value);
  const newMovie = {
    id: cnt.toString(),
    title: movieName.value,
    url: img_url.value,
    rating: rating.value,
  };
  movies.push(newMovie);
  newLi.id = newMovie.id.toString();
  newLi.addEventListener("click", handleDelete.bind(null, newMovie.id.toString()));
  newLi.innerHTML =
    `<div class="movie-element__image" >
    <img src="${newMovie.url}"/>
    </div>
    <div class="movie-element__info">
    <h2>${newMovie.title}</h2>
    <p>${newMovie.rating}</p>
    </div>
    `;
  ul.appendChild(newLi);
  cnt++;
  document.getElementById("add-modal").classList.toggle("visible");
  backdroptoggle();
  clearInputs();
  displaySectionOrMovies();
  //backdroptoggle();
});
