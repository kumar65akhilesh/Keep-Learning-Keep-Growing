class ToolTip {

    constructor(showFunction) {
        this.setToolTipToFalse = showFunction;
    }

    detach() {
        this.setToolTipToFalse();
        //this.remove();
    }
    attach(id) {
        const tooltipElement = document.createElement('div');
        tooltipElement.className = 'card';
        tooltipElement.textContent = 'DUMMY!';
        tooltipElement.addEventListener("click", ()=>{
            tooltipElement.remove();    
            this.detach();
        });
        document.body.append(tooltipElement);
    }
}

class ProjectItem {  
      
    constructor(id, updateProjectHandlerFunction) {
        this.id = id;
        this.updateProjectHandler = updateProjectHandlerFunction;
        //const [moreInfoBtn, activateFinishBtn] = document.getElementById(id).querySelectorAll("button");       
        this.connectSwitchButton(id );
        this.connectMoreInfoButton(id);
    }
    
    showToolTip() {
        if(this.hasToolTip) {
            return;
        }
        const toolTip = new ToolTip(()=>{this.hasToolTip=false;});
        toolTip.attach(this.id);
        this.hasToolTip = true;
    }

    connectMoreInfoButton(id) {
        const moreInfoBtn= document.getElementById(this.id).querySelectorAll("button")[0];
        moreInfoBtn.addEventListener("click", () => this.showToolTip());
    }

    connectSwitchButton(id) {
        const activateFinishBtn= document.getElementById(this.id).querySelectorAll("button")[1];
        activateFinishBtn.addEventListener("click", this.updateProjectHandler.bind(this, id));
    }
}




















class ProjectList {
    projects = [];
    constructor(type) {
        this.type=type;
        const prjItems = document.querySelectorAll(`#${type}-projects li`);
        const isActive = type === "active" ? true : false;
        //this.switchHandler = swithHandlerFunction;
        for(const prjItem of prjItems) {
            this.projects.push(new ProjectItem(prjItem.id, this.switchProject.bind(this)));
        }
    }

    setSwitchHandler(swithHandlerFunction) {
        this.switchHandler = swithHandlerFunction;
    }

    addProject(project) {
        console.log(this);
        this.projects.push(project);
        const activeUL = document.getElementById("active-projects").querySelector("ul");
        const finishedUL = document.getElementById("finished-projects").querySelector("ul");
        console.log(project);
        const elemToMove = document.getElementById(project.id);
        const textBtnToRead = elemToMove.querySelector("button:last-of-type");
        if(textBtnToRead.textContent.trim() === "Finish") {
            finishedUL.appendChild(elemToMove);
            //activeUL.removeChild(elemToMove);
            textBtnToRead.innerHTML = "Activate";
        } else if(textBtnToRead.textContent.trim() === "Activate"){
            activeUL.appendChild(elemToMove);
            //finishedUL.removeChild(elemToMove);
            textBtnToRead.innerHTML = "Finish";
        }
    }

    switchProject(id) {
        const prj = this.projects.find(p => p.id == id);
        const index = this.projects.findIndex(p => p.id === id);
        this.projects.splice(index, 1);
        this.switchHandler(prj);
    }
}

class App {
    
    static init() {
        const activeProjectList = new ProjectList("active"); 
        const finshedProjectList = new ProjectList("finished"); 
        console.log(activeProjectList, activeProjectList);
        activeProjectList.setSwitchHandler(finshedProjectList.addProject);
        finshedProjectList.setSwitchHandler(activeProjectList.addProject);
    }
    
}

App.init();