class ConfirmLink extends HTMLAnchorElement{
    
    connectedCallback() {
        this.addEventListener("click", this.handleClick);
    }
    handleClick(event) {
        if(!confirm("Do you really want to leave?")) {
            event.preventDefault();
        }
    }
}

customElements.define("uc-confim-link", ConfirmLink, {extends:"a"});