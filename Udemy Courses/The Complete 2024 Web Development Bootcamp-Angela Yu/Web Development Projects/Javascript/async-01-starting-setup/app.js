const button = document.querySelector("button");
const output = document.querySelector("p");

const getCoordinates = () => {
  const promise = new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (posData) => {
        resolve(posData);
      },
      (error) => {
        reject(error);
      }
    );
  });

  return promise;
};

const setTimer = (duration) => {
  const promise = new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve("Timer executed - Done!");
    }, duration);
  });
  return promise;
};
function trackUserHandler() {

  Promise.race([getCoordinates(), setTimer(1)]).then( data => console.log(data));
 // let positionData;
  // const posData = await getCoordinates();
  // const timerData = await setTimer(3000);
  // console.log(timerData, posData);
  // console.log("this is done now !");
  // console.log(
  //   getCoordinates().then(
  //     (successData) => {
  //       positionData = successData;
  //       return setTimer(3000);
  //     },
  //     (errorData) => {
  //       return errorData;
  //     }
  //   ).then(
  //     (data) => console.log(data, positionData)
  //   )
  // );
  // navigator.geolocation.getCurrentPosition(
  //   (posData) => {
  //     setTimer(3000).then((data) => console.log(data, posData));
  //   },
  //   (error) => {
  //     console.log(error);
  //   }
  // )

  //console.log("Getting Position...");
}

button.addEventListener("click", trackUserHandler);
