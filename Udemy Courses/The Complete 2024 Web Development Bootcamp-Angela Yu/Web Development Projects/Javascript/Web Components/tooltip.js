class Tooltip extends HTMLElement {
    constructor() {
        super();
        this._tooltipContainer;
        this._tooltipText = "Some dummy tooltip text" ;
        this.attachShadow({mode:"open"});
        //const template= document.getElementById("tooltiptemplate");
        //this.shadowRoot.appendChild(template.content.cloneNode(true));
        this.shadowRoot.innerHTML = 
        `
        <style>
        <div>
            background-color: black;
            color: white;
            position:absolute;
            z-index:10;
        </div>
        </style>
        <slot>
            Some default
        </slot>
        <span>
            (?)
        </span>
        `;
    }
connectedCallback() {
   
    if(this.hasAttribute("text")) {
        this._tooltipText = this.getAttribute("text");
    }
    const tooltipIcon = this.shadowRoot.querySelector("span");
    tooltipIcon.addEventListener("mouseenter", this._showTooltip.bind(this));
    tooltipIcon.addEventListener("mouseleave", this._hideTooltip.bind(this));
    this.shadowRoot.appendChild(tooltipIcon);
    }

_showTooltip() {
    this._tooltipContainer = document.createElement("div");
    this._tooltipContainer.textContent = this._tooltipText;
    this._tooltipContainer.style.backgroundColor= "gray";
    this._tooltipContainer.style.color= "white";
    this._tooltipContainer.style.position = "absolute";
    this._tooltipContainer.style.zIndex="12";
    this.shadowRoot.appendChild( this._tooltipContainer);
}
_hideTooltip() {
    this.shadowRoot.removeChild(this._tooltipContainer);
}

}

customElements.define("uc-tooltip", Tooltip);