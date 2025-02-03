class MyButtonShowHide extends HTMLElement{
    constructor() {
        super();
        this._paragraph;
        this._isHidden;
        this._showHideBtn;
        this._paragraphText = "Dummy paragraph";
        this.attachShadow({mode:"open"});
        this.shadowRoot.innerHTML = `        
        <button id="btnId">Show</button>   
        <slot>Some Default</slot>     
        `;
    }
    connectedCallback() {
        if(this.hasAttribute("text")) {
            this._paragraphText = this.getAttribute("text");
        }
        this._showHideBtn = this.shadowRoot.querySelector("button");
        this.shadowRoot.appendChild(this._showHideBtn);
        this._showHideBtn.addEventListener("click", this.toggleHideShowHandler.bind(this));
    }
    toggleHideShowHandler() {
        let isHidden = "no";
        console.log(this);
        if(this.hasAttribute("isHidden")) {
            isHidden = this.getAttribute("isHidden");
        }
        if(!this._paragraph) {
            console.log("paragraph created!");
            this._paragraph = document.createElement("p");
            this._paragraph.textContent = this._paragraphText;
        }
        if(isHidden === "yes") {            
            
            this.shadowRoot.appendChild(this._paragraph);
            this._showHideBtn.textContent = "Hide";
            this.setAttribute("isHidden", "no");
        } else {
            this.shadowRoot.removeChild(this._paragraph);
            this.setAttribute("isHidden", "yes");
            this._showHideBtn.textContent = "Show";
        }
    }
}
customElements.define("uc-show-hide", MyButtonShowHide);