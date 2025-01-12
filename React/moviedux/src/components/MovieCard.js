import React from "react";
import "../styles.css";

export default function MovieCard(props) {
  const handleError = (e) => {
    e.target.src = "images/default.jpg";
  };

  const getRatingClass = (rating) => {
    if (rating >= 8) {
      return "rating-good";
    } else if (rating >= 5) {
      return "rating-ok";
    } else {
      return "rating-bad";
    }
  };
  return (
    <div key={props.movie.id} className="movie-card">
      <img
        src={`images/${props.movie.image}`}
        onError={handleError}
        alt={props.movie.title}
      />
      <div className="movie-card-info">
        <h3 className="movie-card-title">{props.movie.title}</h3>
        <p className="movie-card-genre">{props.movie.genre}</p>
        <p
          className={`movie-card-rating ${getRatingClass(props.movie.rating)}`}
        >
          {props.movie.rating}
        </p>
      </div>
    </div>
  );
}
