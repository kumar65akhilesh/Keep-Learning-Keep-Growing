import { Modal } from "./UI/Modal";
import { Map } from "./UI/Map";

import { getCoordsFromAddress, getAddressFromCoords } from "./Utility/Location";

class PlaceFinder {
    constructor() {
        const addressForm = document.querySelector("form");
        const locateUserBtn = document.getElementById("locate-btn");
        locateUserBtn.addEventListener("click", this.locateUserHandler.bind(this));
        addressForm.addEventListener("submit", this.findAddressHandler.bind(this));
        this.shareBtn = document.getElementById("share-btn");
        this.shareBtn.addEventListener("click", this.shareAddressHandler.bind(this));
    }

    shareAddressHandler(){
        const sharedLinkInputElem = document.getElementById("share-link");
        if(!navigator.clipboard) {
            sharedLinkInputElem.select();
            return;
        } 
        navigator.clipboard.writeText(sharedLinkInputElem.value).then(()=>{
            console.log("copied");
        }).catch(err => {
            console.log(err);
            sharedLinkInputElem.select();
        });
    }

    selectPlace(coordinates, address) {
        if(this.map) {
            this.map.render(coordinates);
        } else {
            this.map = new Map(coordinates);
        }
        fetch("http://localhost:3000/add-location", {
            method:"POST",
            body:JSON.stringify({
                address: address,
                lat: coordinates.lat,
                lng: coordinates.lng
            }),
            headers: {
                "Content-Type":"application/json"
            }
        }).then(res => {
            return res.json();
        }).then(
            data => {
                const locationId = data.locId;
                this.shareBtn.disabled = false;
                const sharedLinkInputElem = document.getElementById("share-link");
                sharedLinkInputElem.value = `${location.origin}/my-place?location=${locationId}`;
                console.log(data);
            }
        );
        
    }
    
    locateUserHandler() {
        if(!navigator.geolocation) {
            alert("Location feature is not avaialble in browser or manually enter an address.");
            return;
        }
        const modal = new Modal("loading-modal-content", "Loading location - please wait");
        modal.show();
        navigator.geolocation.getCurrentPosition(async (successData) => {
            //modal.hide();
            const coordinates =  {
                lat: successData.coords.latitude,
                lng: successData.coords.longitude
            }
            const address = await getAddressFromCoords(coordinates);
            modal.hide();
            this.selectPlace(coordinates, address);
            console.log(coordinates);
        },(errorData) => {
            modal.hide();
            console.log(errorData);
            alert("Could not locate you. Please enter address manually!");
        });
    }
    async findAddressHandler(event) {
        event.preventDefault();
        const address = event.target.querySelector("input").value;
        if(!address || address.trim().length === 0) {
            alert ("Invalid address");
            return;
        }
        const modal = new Modal("loading-modal-content", "Loading location - please wait");
        modal.show();
        try {
            const coords = await getCoordsFromAddress(address);
            this.selectPlace(coords, address);
        } catch(err) {
            console.log(err);
        }
        modal.hide();
    }

    
}

new PlaceFinder();