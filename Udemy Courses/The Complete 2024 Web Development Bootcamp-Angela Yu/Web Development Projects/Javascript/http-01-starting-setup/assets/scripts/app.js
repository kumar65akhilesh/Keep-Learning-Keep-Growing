const listElement = document.querySelector(".posts");
const postTemplate = document.getElementById("single-post");

function sendHTTPRequest(method, URL, data) {
  const promise = new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.responseType = "json";
    xhr.open(method, URL);
    xhr.send(JSON.stringify(data ? data: ""));
    xhr.onload = function() {        
        resolve(xhr.response);
    }    
  });
  return promise;
}

async function createPost(title, body) {
    const userId = Math.random();
    const post = {
        title: title,
        body:  body,
        userId: userId
    }
    const res = await sendHTTPRequest("post", "https://jsonplaceholder.typicode.com/posts", post);
}

async function fetchPosts() {
  const responseData = await sendHTTPRequest("get", "https://jsonplaceholder.typicode.com/posts");
    for (const post of responseData) {
        const postEl = document.importNode(postTemplate.content, true);
        postEl.querySelector("h2").textContent = post.title.toUpperCase();
        postEl.querySelector("p").textContent = post.body;
        listElement.append(postEl);
    }  
}

const fetchPostBtn = document.querySelector("#available-posts button");
fetchPostBtn.addEventListener("click", fetchPosts);
createPost("dummy title","dummy post");