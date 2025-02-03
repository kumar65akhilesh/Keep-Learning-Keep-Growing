const button = document.querySelector("button");
const textPar = document.querySelector("p");

button.addEventListener("click", () => {
  // do something...
  const text = textPar.textContent;
  if(navigator.clipboard) {
    navigator.clipboard
      .writeText(text)
      .then((result) => {
        console.log(result);
      })
      .catch((err) => {
        console.log(err);
      });
  } else {
    alert("feature not available, please copy manually");
  }
});
