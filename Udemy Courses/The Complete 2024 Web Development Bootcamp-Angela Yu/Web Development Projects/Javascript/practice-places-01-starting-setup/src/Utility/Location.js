const GOOGLE_API_KEY = "xxxxxxx";

export async function getAddressFromCoords(coords) {
    const URL = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${coords.lat},${coords.lng}&key=${GOOGLE_API_KEY}`;
    const response = await fetch(URL);
    if(!response.ok) {
        throw new Error("Failed to fetch Address");
    }
    const data = await response.json();
    if(data.error_message) {
        throw new Error(data.error_message);
    }
    const address = data.results[0].formatted_address;
    return address;
}

export async function getCoordsFromAddress(address) {
    const urladdress =  encodeURI(address);
    const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${urladdress}&key=${GOOGLE_API_KEY}`);   
    if(!response.ok) {
        throw new Error("Failed to fetch coordinates");
    } 
    const data = await response.json();
    if(data.error_message) {
        throw new Error(data.error_message);
    }
    //console.log(data);
    const coordinates = data.results[0].geometry.location;
    return coordinates;
}