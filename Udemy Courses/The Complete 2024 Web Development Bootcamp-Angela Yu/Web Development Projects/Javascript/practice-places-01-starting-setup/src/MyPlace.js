import {Map} from "./UI/Map";
class LoadedPlace {
    constructor(coordinates, address) {
        new Map(coordinates);
        const headerTitleElem = document.querySelector("header h1");
        headerTitleElem.textContent = address;
    }

    
}

    const url = new URL(location.href);
    const queryParams = url.searchParams;
    // const coords = {
    //     lat: +queryParams.get("lat"),
    //     lng: parseFloat(queryParams.get("lng"))
    // }
    // const address = queryParams.get("address");

    const locId = queryParams.get("location");
    fetch("http://localhost:3000/location/"+locId)
    .then(res => {
        if(res.status === 404) {
            throw new Error("Location not found");
        }
        return res.json();
    }).then(data => {
        new LoadedPlace(data.coordinates, data.address);
    }).catch(err => {
        console.log(err);
    });
    //new LoadedPlace(coords,address);