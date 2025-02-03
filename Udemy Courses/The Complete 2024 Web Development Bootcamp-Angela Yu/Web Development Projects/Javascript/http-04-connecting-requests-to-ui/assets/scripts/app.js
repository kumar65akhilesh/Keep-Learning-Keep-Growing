const listElement = document.querySelector(".posts");
const postTemplate = document.getElementById("single-post");
const form = document.querySelector("#new-post form");
const fetchButton = document.querySelector("#available-posts button");
const postList = document.querySelector("ul");

function sendHttpRequest(method, url, data) {
  //const promise = new Promise((resolve, reject) => {
    
    // const xhr = new XMLHttpRequest();

    // xhr.open(method, url);

    // xhr.responseType = "json";

    // xhr.onload = function () {
    //   if (xhr.status >= 200 && xhr.status < 300) {
    //     resolve(xhr.response);
    //   } else {
    //     reject("Something went wrong!");
    //     //return;
    //   }
    //   // const listOfPosts = JSON.parse(xhr.response);
    // };

    // xhr.onerror = function () {
    //   reject("Something went wrong!");
    //   console.log("here" + xhr.response);
    //   console.log("here" + xhr.status);
    //   //return;
    // };

    // xhr.send(JSON.stringify(data));
  //});

  return fetch(url, {method: method, body:JSON.stringify(data)}).then((response) => {return response.json();});
}

async function fetchPosts() {
  try {
    const responseData = await sendHttpRequest(
      "GET",
      "https://jsonplaceholder.typicode.com/posts"
    );

    const listOfPosts = responseData;
    for (const post of listOfPosts) {
      const postEl = document.importNode(postTemplate.content, true);
      postEl.querySelector("h2").textContent = post.title.toUpperCase();
      postEl.querySelector("p").textContent = post.body;
      listElement.append(postEl);
    }
  } catch (error) {
    console.log(error);
  }
}

async function createPost(title, content) {
  const userId = Math.random();
  const post = {
    title: title,
    body: content,
    userId: userId,
  };

  sendHttpRequest("POST", "https://jsonplaceholder.typicode.com/posts", post);
}

fetchButton.addEventListener("click", fetchPosts);
form.addEventListener("submit", (event) => {
  event.preventDefault();
  const enteredTitle = event.currentTarget.querySelector("#title").value;
  const enteredContent = event.currentTarget.querySelector("#content").value;

  createPost(enteredTitle, enteredContent);
});

postList.addEventListener("click", (event) => {
  if (event.target.tagName === "BUTTON") {
    console.log("Clicked");
  }
});
