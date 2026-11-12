const canvas = new fabric.Canvas("designCanvas", {
    preserveObjectStacking: true,
    selection: true
});

let history = [];
let historyIndex = -1;
let selectedShape = "rect";
let selectedFrame = "rounded";
let zoom = 1;
let restoring = false;

const $ = id => document.getElementById(id);

const presets = [
    ["منشور إنستجرام مربع",1080,1080],
    ["منشور إنستجرام طولي",1080,1350],
    ["ستوري إنستجرام",1080,1920],
    ["ريلز",1080,1920],
    ["منشور فيسبوك",1200,630],
    ["غلاف فيسبوك",1640,856],
    ["غلاف يوتيوب",2560,1440],
    ["صورة مصغرة يوتيوب",1280,720],
    ["منشور X",1600,900],
    ["بطاقة شخصية",1050,600],
    ["ورقة A4",2480,3508],
    ["ورقة A3",3508,4961],
    ["ورقة A5",1748,2480],
    ["شهادة تقدير",3508,2480],
    ["عرض تقديمي",1920,1080],
    ["دعوة",1748,2480]
];

function notify(message) {
    const toast = $("toast");
    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(notify.timer);

    notify.timer = setTimeout(() => {
        toast.classList.remove("show");
    }, 2200);
}

function saveHistory() {
    if (restoring) return;

    const state = JSON.stringify(canvas.toJSON());

    history = history.slice(0, historyIndex + 1);
    history.push(state);

    if (history.length > 30) history.shift();

    historyIndex = history.length - 1;
}

function restoreHistory(index) {
    if (index < 0 || index >= history.length) return;

    restoring = true;

    canvas.loadFromJSON(JSON.parse(history[index]), () => {
        canvas.renderAll();
        historyIndex = index;
        restoring = false;
        renderLayers();
        notify("تم استرجاع التصميم");
    });
}

function selected() {
    return canvas.getActiveObject();
}

function setSize(width, height) {
    width = Math.max(50, Math.min(8000, Number(width)));
    height = Math.max(50, Math.min(8000, Number(height)));

    canvas.setDimensions({
        width: width,
        height: height
    });

    $("dimensions").textContent = `${width} × ${height} px`;

    $("customWidth").value = width;
    $("customHeight").value = height;

    fitCanvas();
    canvas.renderAll();
    saveHistory();

    notify("تم تغيير المقاس");
}

function fitCanvas() {
    const area = $("canvasArea");

    const availableWidth = area.clientWidth - 40;
    const availableHeight = area.clientHeight - 40;

    zoom = Math.min(
        availableWidth / canvas.getWidth(),
        availableHeight / canvas.getHeight(),
        1
    );

    applyZoom();
}

function applyZoom() {
    const width = canvas.getWidth() * zoom;
    const height = canvas.getHeight() * zoom;

    canvas.setZoom(zoom);

    canvas.setDimensions({
        width: canvas.getWidth(),
        height: canvas.getHeight()
    }, { cssOnly: true });

    const container = document.querySelector(".canvas-container");

    container.style.width = width + "px";
    container.style.height = height + "px";

    const upper = canvas.upperCanvasEl;
    const lower = canvas.lowerCanvasEl;

    [upper, lower].forEach(element => {
        element.style.width = width + "px";
        element.style.height = height + "px";
    });

    $("zoomValue").textContent = Math.round(zoom * 100) + "%";
}

function renderPresets(search = "") {
    const list = $("presetList");
    list.innerHTML = "";

    presets
        .filter(item => item[0].includes(search))
        .forEach(item => {
            const button = document.createElement("button");

            button.className = "preset";

            button.innerHTML = `
                <b>${item[0]}</b>
                <small>${item[1]} × ${item[2]} px</small>
            `;

            button.addEventListener("click", () => {
                setSize(item[1], item[2]);
            });

            list.appendChild(button);
        });
}

renderPresets();

$("presetSearch").addEventListener("input", event => {
    renderPresets(event.target.value);
});

$("applySize").addEventListener("click", () => {
    setSize(
        $("customWidth").value,
        $("customHeight").value
    );
});

/* TEXT */

function addText(value) {
    if (!value.trim()) {
        notify("اكتب النص أولًا");
        return;
    }

    const text = new fabric.Textbox(value, {
        left: canvas.getWidth() / 2,
        top: canvas.getHeight() / 2,
        width: canvas.getWidth() * 0.75,
        originX: "center",
        originY: "center",
        fontFamily: "Cairo",
        fontSize: 60,
        fontWeight: 700,
        fill: "#172033",
        textAlign: "center",
        direction: "rtl",
        splitByGrapheme: true
    });

    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.renderAll();

    saveHistory();
    renderLayers();

    notify("تمت إضافة النص");
}

$("addText").addEventListener("click", () => {
    addText($("newText").value);
});

$("fontFamily").addEventListener("change", event => {
    const object = selected();

    if (!object || !object.set) return;

    object.set("fontFamily", event.target.value);
    canvas.renderAll();
    saveHistory();
});

$("fontSize").addEventListener("change", event => {
    const object = selected();

    if (!object) return;

    object.set("fontSize", Number(event.target.value));
    canvas.renderAll();
    saveHistory();
});

$("textColor").addEventListener("input", event => {
    const object = selected();

    if (!object) return;

    object.set("fill", event.target.value);
    canvas.renderAll();
});

$("textColor").addEventListener("change", saveHistory);

$("fontWeight").addEventListener("change", event => {
    const object = selected();

    if (!object) return;

    object.set("fontWeight", Number(event.target.value));
    canvas.renderAll();
    saveHistory();
});

$("textStroke").addEventListener("input", event => {
    const object = selected();

    if (!object) return;

    object.set("stroke", event.target.value);
    canvas.renderAll();
});

$("textStrokeWidth").addEventListener("change", event => {
    const object = selected();

    if (!object) return;

    object.set("strokeWidth", Number(event.target.value));
    canvas.renderAll();
    saveHistory();
});

$("textOpacity").addEventListener("input", event => {
    const object = selected();

    if (!object) return;

    object.set("opacity", Number(event.target.value) / 100);
    canvas.renderAll();
});

$("textOpacity").addEventListener("change", saveHistory);

document.querySelectorAll("[data-align]").forEach(button => {
    button.addEventListener("click", () => {
        const object = selected();

        if (!object) return;

        object.set("textAlign", button.dataset.align);
        canvas.renderAll();
        saveHistory();
    });
});

$("boldBtn").addEventListener("click", () => {
    const object = selected();

    if (!object) return;

    object.set(
        "fontWeight",
        object.fontWeight === "900" ? "400" : "900"
    );

    canvas.renderAll();
    saveHistory();
});

$("italicBtn").addEventListener("click", () => {
    const object = selected();

    if (!object) return;

    object.set(
        "fontStyle",
        object.fontStyle === "italic" ? "normal" : "italic"
    );

    canvas.renderAll();
    saveHistory();
});

/* IMAGES */

$("imageInput").addEventListener("change", event => {
    const file = event.target.files[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = function (result) {
        fabric.Image.fromURL(result.target.result, image => {
            const scale = Math.min(
                canvas.getWidth() * 0.6 / image.width,
                canvas.getHeight() * 0.6 / image.height
            );

            image.set({
                left: canvas.getWidth() / 2,
                top: canvas.getHeight() / 2,
                originX: "center",
                originY: "center",
                scaleX: scale,
                scaleY: scale
            });

            canvas.add(image);
            canvas.setActiveObject(image);
            canvas.renderAll();

            saveHistory();
            renderLayers();

            notify("تمت إضافة الصورة");
        });
    };

    reader.readAsDataURL(file);
    event.target.value = "";
});

/* SHAPES */

function addShape(type) {
    const fill = $("shapeColor").value;
    const stroke = $("shapeBorder").value;
    const strokeWidth = Number($("shapeBorderWidth").value);

    const common = {
        left: canvas.getWidth() / 2,
        top: canvas.getHeight() / 2,
        originX: "center",
        originY: "center",
        fill: fill,
        stroke: strokeWidth ? stroke : null,
        strokeWidth: strokeWidth
    };

    let shape;

    if (type === "rect") {
        shape = new fabric.Rect({
            ...common,
            width: 350,
            height: 220,
            rx: 18,
            ry: 18
        });
    }

    if (type === "circle") {
        shape = new fabric.Circle({
            ...common,
            radius: 130
        });
    }

    if (type === "triangle") {
        shape = new fabric.Triangle({
            ...common,
            width: 250,
            height: 250
        });
    }

    if (type === "line") {
        shape = new fabric.Line(
            [-200, 0, 200, 0],
            {
                ...common,
                fill: "",
                stroke: stroke,
                strokeWidth: Math.max(strokeWidth, 8)
            }
        );
    }

    if (type === "star") {
        shape = new fabric.Polygon(
            polygonPoints(10, 130, 60),
            common
        );
    }

    if (type === "hex") {
        shape = new fabric.Polygon(
            polygonPoints(6, 130, 130),
            common
        );
    }

    if (type === "pentagon") {
        shape = new fabric.Polygon(
            polygonPoints(5, 130, 130),
            common
        );
    }

    if (type === "arrow") {
        shape = new fabric.Path(
            "M 0 40 L 140 40 L 140 0 L 220 70 L 140 140 L 140 100 L 0 100 z",
            common
        );
    }

    if (!shape) return;

    canvas.add(shape);
    canvas.setActiveObject(shape);
    canvas.renderAll();

    saveHistory();
    renderLayers();

    notify("تمت إضافة الشكل");
}

function polygonPoints(number, outer, inner) {
    const points = [];

    for (let i = 0; i < number; i++) {
        const angle = i * Math.PI * 2 / number - Math.PI / 2;

        points.push({
            x: outer + outer * Math.cos(angle),
            y: outer + outer * Math.sin(angle)
        });
    }

    return points;
}

document.querySelectorAll("[data-shape]").forEach(button => {
    button.addEventListener("click", () => {
        selectedShape = button.dataset.shape;

        document.querySelectorAll("[data-shape]").forEach(item => {
            item.style.borderColor = "";
        });

        button.style.borderColor = "#d9b968";

        addShape(selectedShape);
    });
});

$("addShape").addEventListener("click", () => {
    addShape(selectedShape);
});

/* FRAMES */

document.querySelectorAll("[data-frame]").forEach(button => {
    button.addEventListener("click", () => {
        const image = selected();

        if (!image || image.type !== "image") {
            notify("حدد صورة أولًا ثم اختر الإطار");
            return;
        }

        let clip;

        if (button.dataset.frame === "circle") {
            clip = new fabric.Circle({
                radius: Math.min(image.width, image.height) / 2,
                originX: "center",
                originY: "center"
            });
        } else if (button.dataset.frame === "diamond") {
            clip = new fabric.Rect({
                width: image.width,
                height: image.height,
                angle: 45,
                originX: "center",
                originY: "center"
            });
        } else {
            clip = new fabric.Rect({
                width: image.width,
                height: image.height,
                rx: button.dataset.frame === "rounded" ? 40 : 0,
                ry: button.dataset.frame === "rounded" ? 40 : 0,
                originX: "center",
                originY: "center"
            });
        }

        image.set("clipPath", clip);
        canvas.renderAll();
        saveHistory();

        notify("تم تطبيق الإطار");
    });
});

/* OBJECT PROPERTIES */

$("opacity").addEventListener("input", event => {
    const object = selected();

    if (!object) return;

    object.set("opacity", Number(event.target.value) / 100);
    canvas.renderAll();
});

$("opacity").addEventListener("change", saveHistory);

$("rotation").addEventListener("input", event => {
    const object = selected();

    if (!object) return;

    object.rotate(Number(event.target.value));
    canvas.renderAll();
});

$("rotation").addEventListener("change", saveHistory);

$("objectStroke").addEventListener("input", event => {
    const object = selected();

    if (!object) return;

    object.set("stroke", event.target.value);
    canvas.renderAll();
});

$("objectStrokeWidth").addEventListener("input", event => {
    const object = selected();

    if (!object) return;

    object.set("strokeWidth", Number(event.target.value));
    canvas.renderAll();
});

$("objectStrokeWidth").addEventListener("change", saveHistory);

$("removeEffects").addEventListener("click", () => {
    const object = selected();

    if (!object) return;

    object.set({
        opacity: 1,
        stroke: null,
        strokeWidth: 0,
        shadow: null,
        clipPath: null
    });

    canvas.renderAll();
    saveHistory();

    notify("تمت إزالة التأثيرات");
});

/* BACKGROUND */

$("backgroundColor").addEventListener("input", event => {
    canvas.backgroundImage = null;
    canvas.backgroundColor = event.target.value;
    canvas.renderAll();
});

$("backgroundColor").addEventListener("change", saveHistory);

document.querySelectorAll("[data-bg]").forEach(button => {
    button.addEventListener("click", () => {
        canvas.backgroundImage = null;
        canvas.backgroundColor = button.dataset.bg;
        $("backgroundColor").value = button.dataset.bg;
        canvas.renderAll();
        saveHistory();
    });
});

$("applyGradient").addEventListener("click", () => {
    const value = $("gradientSelect").value;

    if (!value) return;

    const colors = value.match(/#[0-9a-fA-F]{6}/g);

    if (!colors || colors.length < 2) return;

    const gradient = new fabric.Gradient({
        type: "linear",
        gradientUnits: "percentage",
        coords: {
            x1: 0,
            y1: 0,
            x2: 1,
            y2: 1
        },
        colorStops: colors.map((color, index) => ({
            offset: index / (colors.length - 1),
            color: color
        }))
    });

    canvas.backgroundImage = null;
    canvas.backgroundColor = gradient;
    canvas.renderAll();

    saveHistory();
    notify("تم تطبيق التدرج");
});

$("backgroundImage").addEventListener("change", event => {
    const file = event.target.files[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = result => {
        fabric.Image.fromURL(result.target.result, image => {
            image.scaleToWidth(canvas.getWidth());
            image.scaleToHeight(canvas.getHeight());

            image.set({
                left: 0,
                top: 0,
                selectable: false,
                evented: false
            });

            canvas.backgroundImage = image;
            canvas.renderAll();

            saveHistory();
            notify("تم تغيير الخلفية");
        });
    };

    reader.readAsDataURL(file);
    event.target.value = "";
});

$("resetBackground").addEventListener("click", () => {
    canvas.backgroundImage = null;
    canvas.backgroundColor = "#ffffff";
    canvas.renderAll();

    saveHistory();
    notify("تمت إعادة الخلفية");
});

/* LAYERS */

function renderLayers() {
    const list = $("layersList");

    list.innerHTML = "";

    const objects = canvas.getObjects().slice().reverse();

    if (!objects.length) {
        list.innerHTML = "<p>لا توجد عناصر في التصميم</p>";
        return;
    }

    objects.forEach((object, index) => {
        const item = document.createElement("button");

        item.className = "layer-item";

        if (object === selected()) {
            item.classList.add("active");
        }

        let name = object.type === "textbox" ? "نص" :
            object.type === "image" ? "صورة" :
            object.type === "line" ? "خط" : "شكل";

        item.textContent = `${name} ${objects.length - index}`;

        item.addEventListener("click", () => {
            canvas.setActiveObject(object);
            canvas.renderAll();
            renderLayers();
        });

        list.appendChild(item);
    });
}

canvas.on("selection:created", renderLayers);
canvas.on("selection:updated", renderLayers);
canvas.on("selection:cleared", renderLayers);
canvas.on("object:added", renderLayers);
canvas.on("object:removed", renderLayers);

$("bringFront").addEventListener("click", () => {
    const object = selected();

    if (!object) return;

    canvas.bringToFront(object);
    canvas.renderAll();
    saveHistory();
    renderLayers();
});

$("sendBack").addEventListener("click", () => {
    const object = selected();

    if (!object) return;

    canvas.sendToBack(object);
    canvas.renderAll();
    saveHistory();
    renderLayers();
});

$("duplicateBtn").addEventListener("click", () => {
    const object = selected();

    if (!object) {
        notify("حدد عنصرًا أولًا");
        return;
    }

    object.clone().then(clone => {
        clone.set({
            left: object.left + 25,
            top: object.top + 25
        });

        canvas.add(clone);
        canvas.setActiveObject(clone);
        canvas.renderAll();

        saveHistory();
        renderLayers();
    });
});

function deleteSelected() {
    const object = selected();

    if (!object) {
        notify("حدد عنصرًا أولًا");
        return;
    }

    canvas.remove(object);
    canvas.discardActiveObject();
    canvas.renderAll();

    saveHistory();
    renderLayers();
}

$("deleteBtn").addEventListener("click", deleteSelected);
$("deleteText").addEventListener("click", deleteSelected);
$("deleteObject").addEventListener("click", deleteSelected);

/* UNDO / REDO */

$("undoBtn").addEventListener("click", () => {
    restoreHistory(historyIndex - 1);
});

$("redoBtn").addEventListener("click", () => {
    restoreHistory(historyIndex + 1);
});

canvas.on("object:modified", () => {
    saveHistory();
    renderLayers();
});

/* TABS */

document.querySelectorAll(".tab").forEach(button => {
    button.addEventListener("click", () => {
        document.querySelectorAll(".tab").forEach(item => {
            item.classList.remove("active");
        });

        document.querySelectorAll(".tab-content").forEach(item => {
            item.classList.remove("active");
        });

        button.classList.add("active");
        $(button.dataset.tab).classList.add("active");
    });
});

/* ZOOM */

$("zoomIn").addEventListener("click", () => {
    zoom = Math.min(zoom + 0.1, 2);
    applyZoom();
});

$("zoomOut").addEventListener("click", () => {
    zoom = Math.max(zoom - 0.1, 0.1);
    applyZoom();
});

$("fitCanvas").addEventListener("click", fitCanvas);

/* GRID */

$("gridToggle").addEventListener("click", () => {
    $("canvasArea").classList.toggle("grid-visible");
});

/* CLEAR */

$("clearCanvas").addEventListener("click", () => {
    if (!confirm("هل تريد مسح جميع عناصر التصميم؟")) return;

    canvas.clear();
    canvas.backgroundColor = "#ffffff";
    canvas.renderAll();

    saveHistory();
    renderLayers();

    notify("تم مسح التصميم");
});

/* EXPORT */

$("exportBtn").addEventListener("click", () => {
    const name = $("projectName").value.trim() || "my-design";

    const data = canvas.toDataURL({
        format: "png",
        multiplier: 2
    });

    const link = document.createElement("a");

    link.download = name + ".png";
    link.href = data;
    link.click();

    notify("تم تصدير التصميم");
});

/* SAVE PROJECT */

$("saveBtn").addEventListener("click", () => {
    const project = {
        name: $("projectName").value,
        width: canvas.getWidth(),
        height: canvas.getHeight(),
        data: canvas.toJSON()
    };

    const blob = new Blob(
        [JSON.stringify(project)],
        { type: "application/json" }
    );

    const link = document.createElement("a");

    link.href = URL.createObjectURL(blob);
    link.download = "creative-project.json";
    link.click();

    URL.revokeObjectURL(link.href);

    notify("تم حفظ المشروع");
});

/* INITIALIZATION */

canvas.setBackgroundColor("#ffffff", canvas.renderAll.bind(canvas));

setTimeout(() => {
    fitCanvas();
    saveHistory();
    renderLayers();
}, 500);

window.addEventListener("resize", fitCanvas);
