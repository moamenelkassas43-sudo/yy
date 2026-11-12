const canvas = document.getElementById("designCanvas");
const emptyMessage = document.getElementById("emptyMessage");

let selectedElement = null;
let elements = [];
let history = [];
let historyIndex = -1;
let elementCounter = 0;
let backgroundImage = null;

function toast(message){
    const box = document.getElementById("toast");
    box.textContent = message;
    box.classList.add("show");

    setTimeout(()=>{
        box.classList.remove("show");
    },2200);
}

function saveHistory(){
    const snapshot = {
        html:canvas.innerHTML,
        background:canvas.style.background,
        backgroundImage:canvas.style.backgroundImage,
        backgroundSize:canvas.style.backgroundSize,
        backgroundPosition:canvas.style.backgroundPosition
    };

    history = history.slice(0,historyIndex+1);
    history.push(snapshot);

    if(history.length>40) history.shift();

    historyIndex = history.length-1;
}

function restoreHistory(index){
    if(index<0 || index>=history.length) return;

    const state = history[index];

    canvas.innerHTML = state.html;
    canvas.style.background = state.background;
    canvas.style.backgroundImage = state.backgroundImage;
    canvas.style.backgroundSize = state.backgroundSize;
    canvas.style.backgroundPosition = state.backgroundPosition;

    selectedElement = null;
    refreshElements();
    updateEmpty();
    historyIndex = index;
}

function refreshElements(){
    elements = [...canvas.querySelectorAll(".canvas-element")];

    elements.forEach(el=>{
        el.addEventListener("pointerdown",startDrag);
        el.addEventListener("click",e=>{
            e.stopPropagation();
            selectElement(el);
        });
    });
}

function updateEmpty(){
    const hasElements = canvas.querySelectorAll(".canvas-element").length>0;
    emptyMessage.style.display = hasElements ? "none" : "flex";
}

function selectElement(el){
    if(selectedElement) selectedElement.classList.remove("selected");

    selectedElement = el;

    if(!el) return;

    el.classList.add("selected");

    const isText = el.classList.contains("canvas-text");

    document.getElementById("editText").value = isText ? el.textContent : "";

    if(isText){
        document.getElementById("fontFamily").value =
            el.dataset.font || "Cairo";

        document.getElementById("fontSize").value =
            parseInt(el.style.fontSize) || 45;

        document.getElementById("fontSizeValue").textContent =
            (parseInt(el.style.fontSize)||45)+"px";

        document.getElementById("textColor").value =
            rgbToHex(el.style.color || "rgb(255,255,255)");
    }

    document.getElementById("elementOpacity").value =
        Math.round((parseFloat(el.style.opacity)||1)*100);

    document.getElementById("opacityValue").textContent =
        document.getElementById("elementOpacity").value+"%";

    document.getElementById("elementRotate").value =
        parseInt(el.dataset.rotate)||0;

    document.getElementById("rotateValue").textContent =
        (parseInt(el.dataset.rotate)||0)+"°";

    document.getElementById("elementScale").value =
        parseInt(el.dataset.scale)||100;

    document.getElementById("scaleValue").textContent =
        (parseInt(el.dataset.scale)||100)+"%";
}

function rgbToHex(color){
    if(color.startsWith("#")) return color;

    const values = color.match(/\d+/g);

    if(!values || values.length<3) return "#ffffff";

    return "#"+values.slice(0,3).map(v=>
        Number(v).toString(16).padStart(2,"0")
    ).join("");
}

function createElement(type){
    const el = document.createElement("div");

    el.className = "canvas-element";
    el.dataset.id = ++elementCounter;
    el.dataset.rotate = "0";
    el.dataset.scale = "100";

    el.style.left = "50%";
    el.style.top = "50%";
    el.style.transform = "translate(-50%,-50%)";

    return el;
}

function addText(text){
    if(!text.trim()){
        toast("اكتب النص أولًا");
        return;
    }

    const el = createElement("text");

    el.classList.add("canvas-text");
    el.textContent = text;
    el.style.fontFamily = "Cairo";
    el.style.fontSize = "45px";
    el.style.color = "#ffffff";
    el.style.fontWeight = "700";
    el.style.width = "75%";
    el.style.textAlign = "center";
    el.style.textShadow = "0 2px 5px #0005";

    canvas.appendChild(el);

    refreshElements();
    selectElement(el);
    updateEmpty();
    saveHistory();

    toast("تمت إضافة النص");
}

document.getElementById("addTextBtn").addEventListener("click",()=>{
    addText(document.getElementById("newText").value);
});

document.getElementById("editText").addEventListener("input",e=>{
    if(!selectedElement || !selectedElement.classList.contains("canvas-text")) return;

    selectedElement.textContent = e.target.value;
});

document.getElementById("editText").addEventListener("change",saveHistory);

document.getElementById("fontFamily").addEventListener("change",e=>{
    if(!selectedElement) return;

    selectedElement.style.fontFamily = e.target.value;
    selectedElement.dataset.font = e.target.value;
    saveHistory();
});

document.getElementById("fontSize").addEventListener("input",e=>{
    document.getElementById("fontSizeValue").textContent = e.target.value+"px";

    if(selectedElement && selectedElement.classList.contains("canvas-text")){
        selectedElement.style.fontSize = e.target.value+"px";
    }
});

document.getElementById("fontSize").addEventListener("change",saveHistory);

document.getElementById("textColor").addEventListener("input",e=>{
    if(selectedElement && selectedElement.classList.contains("canvas-text")){
        selectedElement.style.color = e.target.value;
    }
});

document.getElementById("textColor").addEventListener("change",saveHistory);

document.querySelectorAll("[data-align]").forEach(btn=>{
    btn.addEventListener("click",()=>{
        if(!selectedElement || !selectedElement.classList.contains("canvas-text")) return;

        selectedElement.style.textAlign = btn.dataset.align;
        saveHistory();
    });
});

document.getElementById("boldBtn").addEventListener("click",()=>{
    if(!selectedElement) return;

    selectedElement.style.fontWeight =
        selectedElement.style.fontWeight==="900" ? "400" : "900";

    saveHistory();
});

function startDrag(e){
    if(e.target.closest("button")) return;

    e.preventDefault();

    selectElement(e.currentTarget);

    const el = e.currentTarget;
    const rect = canvas.getBoundingClientRect();

    const startX = e.clientX;
    const startY = e.clientY;

    const initialLeft = parseFloat(el.style.left);
    const initialTop = parseFloat(el.style.top);

    function move(ev){
        const dx = (ev.clientX-startX)/rect.width*100;
        const dy = (ev.clientY-startY)/rect.height*100;

        el.style.left = (initialLeft+dx)+"%";
        el.style.top = (initialTop+dy)+"%";
    }

    function stop(){
        document.removeEventListener("pointermove",move);
        document.removeEventListener("pointerup",stop);
        saveHistory();
    }

    document.addEventListener("pointermove",move);
    document.addEventListener("pointerup",stop);
}

canvas.addEventListener("click",e=>{
    if(e.target===canvas){
        if(selectedElement) selectedElement.classList.remove("selected");
        selectedElement = null;
    }
});

document.getElementById("imageInput").addEventListener("change",e=>{
    const file = e.target.files[0];

    if(!file) return;

    const reader = new FileReader();

    reader.onload = event=>{
        const img = document.createElement("img");

        img.src = event.target.result;
        img.className = "canvas-element canvas-image";
        img.dataset.id = ++elementCounter;
        img.dataset.rotate = "0";
        img.dataset.scale = "100";

        img.style.width = "250px";
        img.style.left = "50%";
        img.style.top = "50%";
        img.style.transform = "translate(-50%,-50%)";

        canvas.appendChild(img);

        refreshElements();
        selectElement(img);
        updateEmpty();
        saveHistory();

        toast("تمت إضافة الصورة");
    };

    reader.readAsDataURL(file);
    e.target.value = "";
});

document.getElementById("addShapeBtn").addEventListener("click",()=>{
    const type = document.querySelector(".shape-btn.active")?.dataset.shape || "rectangle";
    const color = document.getElementById("shapeColor").value;

    const el = createElement("shape");
    el.classList.add("canvas-shape");

    el.style.width = type==="line" ? "220px" : "150px";
    el.style.height = type==="line" ? "5px" : "150px";
    el.style.background = color;

    if(type==="circle") el.style.borderRadius = "50%";

    if(type==="triangle"){
        el.style.background = "transparent";
        el.style.width = "0";
        el.style.height = "0";
        el.style.borderLeft = "75px solid transparent";
        el.style.borderRight = "75px solid transparent";
        el.style.borderBottom = "130px solid "+color;
    }

    if(type==="line") el.style.borderRadius = "10px";

    canvas.appendChild(el);

    refreshElements();
    selectElement(el);
    updateEmpty();
    saveHistory();

    toast("تمت إضافة الشكل");
});

document.querySelectorAll(".shape-btn").forEach(btn=>{
    btn.addEventListener("click",()=>{
        document.querySelectorAll(".shape-btn").forEach(b=>b.classList.remove("active"));
        btn.classList.add("active");
    });
});

document.getElementById("elementOpacity").addEventListener("input",e=>{
    document.getElementById("opacityValue").textContent = e.target.value+"%";

    if(selectedElement){
        selectedElement.style.opacity = e.target.value/100;
    }
});

document.getElementById("elementOpacity").addEventListener("change",saveHistory);

document.getElementById("elementRotate").addEventListener("input",e=>{
    if(!selectedElement) return;

    const value = e.target.value;

    document.getElementById("rotateValue").textContent = value+"°";
    selectedElement.dataset.rotate = value;

    selectedElement.style.transform =
        `translate(-50%,-50%) rotate(${value}deg)`;
});

document.getElementById("elementRotate").addEventListener("change",saveHistory);

document.getElementById("elementScale").addEventListener("input",e=>{
    if(!selectedElement) return;

    const value = e.target.value;

    document.getElementById("scaleValue").textContent = value+"%";
    selectedElement.dataset.scale = value;

    if(selectedElement.classList.contains("canvas-image")){
        selectedElement.style.width = (250*value/100)+"px";
    }else{
        selectedElement.style.scale = value/100;
    }
});

document.getElementById("elementScale").addEventListener("change",saveHistory);

function deleteSelected(){
    if(!selectedElement){
        toast("حدد عنصرًا أولًا");
        return;
    }

    selectedElement.remove();
    selectedElement = null;

    refreshElements();
    updateEmpty();
    saveHistory();

    toast("تم حذف العنصر");
}

document.getElementById("deleteElementBtn").addEventListener("click",deleteSelected);
document.getElementById("deleteImageBtn").addEventListener("click",deleteSelected);

document.getElementById("backgroundColor").addEventListener("input",e=>{
    canvas.style.backgroundImage = "none";
    canvas.style.backgroundColor = e.target.value;
});

document.getElementById("backgroundColor").addEventListener("change",saveHistory);

document.querySelectorAll("[data-bg]").forEach(btn=>{
    btn.addEventListener("click",()=>{
        canvas.style.backgroundImage = "none";
        canvas.style.backgroundColor = btn.dataset.bg;

        document.getElementById("backgroundColor").value = btn.dataset.bg;

        saveHistory();
    });
});

document.getElementById("backgroundImageInput").addEventListener("change",e=>{
    const file = e.target.files[0];

    if(!file) return;

    const reader = new FileReader();

    reader.onload = event=>{
        canvas.style.backgroundImage = `url("${event.target.result}")`;
        canvas.style.backgroundSize = "cover";
        canvas.style.backgroundPosition = "center";

        saveHistory();
        toast("تم تغيير الخلفية");
    };

    reader.readAsDataURL(file);
    e.target.value = "";
});

document.getElementById("canvasPreset").addEventListener("change",e=>{
    const [width,height] = e.target.value.split(",").map(Number);

    canvas.dataset.width = width;
    canvas.dataset.height = height;

    canvas.style.aspectRatio = `${width}/${height}`;

    const maxWidth = Math.min(540,width/2);
    const displayHeight = maxWidth*height/width;

    canvas.style.width = maxWidth+"px";
    canvas.style.height = displayHeight+"px";

    document.getElementById("canvasSizeLabel").textContent =
        width+" × "+height;

    saveHistory();
});

document.getElementById("duplicateBtn").addEventListener("click",()=>{
    if(!selectedElement){
        toast("حدد عنصرًا أولًا");
        return;
    }

    const clone = selectedElement.cloneNode(true);

    clone.classList.remove("selected");
    clone.dataset.id = ++elementCounter;

    clone.style.left =
        (parseFloat(selectedElement.style.left)+5)+"%";

    clone.style.top =
        (parseFloat(selectedElement.style.top)+5)+"%";

    canvas.appendChild(clone);

    refreshElements();
    selectElement(clone);
    saveHistory();

    toast("تم نسخ العنصر");
});

document.getElementById("frontBtn").addEventListener("click",()=>{
    if(!selectedElement) return;

    canvas.appendChild(selectedElement);
    saveHistory();
});

document.getElementById("backBtn").addEventListener("click",()=>{
    if(!selectedElement) return;

    canvas.insertBefore(selectedElement,canvas.children[0]);
    saveHistory();
});

document.getElementById("undoBtn").addEventListener("click",()=>{
    if(historyIndex>0){
        restoreHistory(historyIndex-1);
        toast("تم التراجع");
    }
});

document.getElementById("redoBtn").addEventListener("click",()=>{
    if(historyIndex<history.length-1){
        restoreHistory(historyIndex+1);
        toast("تمت إعادة التعديل");
    }
});

document.getElementById("clearBtn").addEventListener("click",()=>{
    if(!confirm("هل تريد مسح جميع عناصر التصميم؟")) return;

    canvas.querySelectorAll(".canvas-element").forEach(el=>el.remove());

    selectedElement = null;
    updateEmpty();
    saveHistory();

    toast("تم مسح التصميم");
});

document.querySelectorAll(".tab").forEach(tab=>{
    tab.addEventListener("click",()=>{
        document.querySelectorAll(".tab").forEach(t=>t.classList.remove("active"));
        document.querySelectorAll(".tab-content").forEach(c=>c.classList.remove("active"));

        tab.classList.add("active");
        document.getElementById(tab.dataset.tab).classList.add("active");
    });
});

document.getElementById("downloadBtn").addEventListener("click",async()=>{
    if(typeof html2canvas==="undefined"){
        toast("تعذر تحميل أداة التصدير. تحقق من الإنترنت.");
        return;
    }

    if(selectedElement) selectedElement.classList.remove("selected");

    toast("جاري تجهيز التصميم...");

    try{
        const width = Number(canvas.dataset.width)||1080;
        const height = Number(canvas.dataset.height)||1080;

        const output = await html2canvas(canvas,{
            scale:Math.max(2,width/canvas.clientWidth),
            backgroundColor:null,
            useCORS:true
        });

        const link = document.createElement("a");

        link.download = "my-design.png";
        link.href = output.toDataURL("image/png");
        link.click();

        toast("تم تحميل التصميم بنجاح");
    }catch(error){
        console.error(error);
        toast("حدث خطأ أثناء التصدير");
    }

    if(selectedElement) selectedElement.classList.add("selected");
});

document.getElementById("saveProjectBtn").addEventListener("click",()=>{
    const data = {
        html:canvas.innerHTML,
        background:canvas.style.background,
        backgroundImage:canvas.style.backgroundImage,
        backgroundSize:canvas.style.backgroundSize,
        backgroundPosition:canvas.style.backgroundPosition,
        width:canvas.dataset.width||1080,
        height:canvas.dataset.height||1080
    };

    const blob = new Blob([JSON.stringify(data)],{
        type:"application/json"
    });

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "design-project.json";
    link.click();

    URL.revokeObjectURL(link.href);

    toast("تم حفظ المشروع");
});

document.getElementById("loadProjectInput").addEventListener("change",e=>{
    const file = e.target.files[0];

    if(!file) return;

    const reader = new FileReader();

    reader.onload = event=>{
        try{
            const data = JSON.parse(event.target.result);

            canvas.innerHTML = data.html;
            canvas.style.background = data.background||"white";
            canvas.style.backgroundImage = data.backgroundImage||"none";
            canvas.style.backgroundSize = data.backgroundSize||"cover";
            canvas.style.backgroundPosition = data.backgroundPosition||"center";

            canvas.dataset.width = data.width||1080;
            canvas.dataset.height = data.height||1080;
            canvas.style.aspectRatio = `${canvas.dataset.width}/${canvas.dataset.height}`;

            selectedElement = null;
            refreshElements();
            updateEmpty();
            saveHistory();

            toast("تم فتح المشروع بنجاح");
        }catch(error){
            toast("ملف المشروع غير صالح");
        }
    };

    reader.readAsText(file);
    e.target.value = "";
});

refreshElements();
updateEmpty();
saveHistory();
