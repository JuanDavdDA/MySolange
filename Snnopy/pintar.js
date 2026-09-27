const canvas = document.getElementById("paintCanvas");
const ctx = canvas.getContext("2d", {
    willReadFrequently: true
});

const canvasWrap = document.getElementById("canvasWrap");
const canvasMessage = document.getElementById("canvasMessage");
const canvasLoading = document.getElementById("canvasLoading");

const palette = document.getElementById("palette");
const customColor = document.getElementById("customColor");
const selectedName = document.getElementById("selectedName");

const progressText = document.getElementById("progressText");
const drawingTitle = document.getElementById("drawingTitle");

const undoBtn = document.getElementById("undoBtn");
const resetBtn = document.getElementById("resetBtn");
const saveBtn = document.getElementById("saveBtn");

const drawingOptions =
    document.querySelectorAll(".drawing-option");


/* =========================
   VARIABLES
========================= */

let selectedColor = "#ff8fb1";

let originalImageData = null;

let history = [];

let paintedPixels = 0;

let totalPaintablePixels = 0;

let currentImage = "snoopy_colorear.png";

let sourceImage = new Image();

let isLoading = false;


/*
    Umbral para detectar las líneas
*/
const LINE_THRESHOLD = 145;


/*
    Umbral para considerar una zona blanca
*/
const WHITE_THRESHOLD = 175;


/*
    Evita que el relleno pinte
    prácticamente toda la imagen
*/
const MAX_FILL_RATIO = 0.42;


/* =========================
   CARGAR DIBUJO
========================= */

function loadDrawing(imageName, title) {

    isLoading = true;

    currentImage = imageName;

    drawingTitle.textContent = title;

    canvasMessage.classList.remove("hidden");

    canvasLoading.classList.remove("hidden");

    history = [];

    paintedPixels = 0;

    totalPaintablePixels = 0;

    progressText.textContent = "0%";


    sourceImage = new Image();


    sourceImage.onload = function () {

        const maxWidth = 900;

        let width = sourceImage.naturalWidth;
        let height = sourceImage.naturalHeight;


        /*
            Reducimos imágenes demasiado grandes
            para que el canvas funcione mejor.
        */

        if (width > maxWidth) {

            const ratio = maxWidth / width;

            width = Math.round(width * ratio);

            height = Math.round(height * ratio);
        }


        canvas.width = width;
        canvas.height = height;


        ctx.clearRect(
            0,
            0,
            canvas.width,
            canvas.height
        );


        ctx.drawImage(
            sourceImage,
            0,
            0,
            canvas.width,
            canvas.height
        );


        /*
            Guardamos la imagen original.
        */

        originalImageData = ctx.getImageData(
            0,
            0,
            canvas.width,
            canvas.height
        );


        calculatePaintablePixels();


        /*
            Guardamos el estado inicial.
        */

        history = [
            new ImageData(
                new Uint8ClampedArray(
                    originalImageData.data
                ),
                originalImageData.width,
                originalImageData.height
            )
        ];


        canvasMessage.classList.add("hidden");

        canvasLoading.classList.add("hidden");


        isLoading = false;


        updateProgress();
    };


    sourceImage.onerror = function () {

        isLoading = false;

        canvasLoading.innerHTML = `
            <span>😢</span>
            <b>No se pudo cargar el dibujo</b>
            <small>Revisa el nombre de la imagen.</small>
        `;
    };


    /*
        Evitamos problemas con caché
    */

    sourceImage.src =
        imageName + "?v=" + Date.now();
}


/* =========================
   CAMBIO DE DIBUJO
========================= */

drawingOptions.forEach(option => {

    option.addEventListener("click", () => {

        drawingOptions.forEach(item => {
            item.classList.remove("active");
        });

        option.classList.add("active");


        const imageName =
            option.dataset.image;

        const title =
            option.dataset.title;


        loadDrawing(
            imageName,
            title
        );
    });

});


/*
    Dibujo inicial
*/

loadDrawing(
    "snoopy_colorear.png",
    "Un picnic para colorear ♡"
);


/* =========================
   PALETA
========================= */

const colorButtons =
    document.querySelectorAll(".color");


colorButtons.forEach(button => {

    button.addEventListener("click", () => {

        colorButtons.forEach(item => {
            item.classList.remove("active");
        });

        button.classList.add("active");


        selectedColor =
            button.dataset.color;


        selectedName.textContent =
            "Color seleccionado ♡";


        customColor.value =
            selectedColor;
    });

});


/* =========================
   COLOR PERSONALIZADO
========================= */

customColor.addEventListener(
    "input",
    () => {

        selectedColor =
            customColor.value;


        colorButtons.forEach(item => {
            item.classList.remove("active");
        });


        selectedName.textContent =
            "Tu color personalizado ♡";
    }
);


/* =========================
   CLICK / TOUCH CANVAS
========================= */

canvas.addEventListener(
    "pointerdown",
    event => {

        if (isLoading) {
            return;
        }


        event.preventDefault();


        const rect =
            canvas.getBoundingClientRect();


        const scaleX =
            canvas.width / rect.width;

        const scaleY =
            canvas.height / rect.height;


        const x =
            Math.floor(
                (event.clientX - rect.left) *
                scaleX
            );

        const y =
            Math.floor(
                (event.clientY - rect.top) *
                scaleY
            );


        fillAtPoint(
            x,
            y,
            selectedColor
        );
    }
);


/* =========================
   FLOOD FILL
========================= */

function fillAtPoint(
    startX,
    startY,
    color
) {

    if (
        startX < 0 ||
        startY < 0 ||
        startX >= canvas.width ||
        startY >= canvas.height
    ) {
        return;
    }


    const imageData =
        ctx.getImageData(
            0,
            0,
            canvas.width,
            canvas.height
        );


    const data =
        imageData.data;


    const index =
        (startY * canvas.width + startX) * 4;


    /*
        No pintar líneas negras
    */

    const startBrightness =
        (
            data[index] +
            data[index + 1] +
            data[index + 2]
        ) / 3;


    if (
        startBrightness <
        LINE_THRESHOLD
    ) {
        return;
    }


    /*
        Convertimos color
    */

    const rgb =
        hexToRgb(color);


    /*
        Usamos una máscara de visitados
    */

    const visited =
        new Uint8Array(
            canvas.width *
            canvas.height
        );


    const stack = [
        [startX, startY]
    ];


    const pixelsToPaint = [];


    while (stack.length > 0) {

        const [x, y] =
            stack.pop();


        if (
            x < 0 ||
            y < 0 ||
            x >= canvas.width ||
            y >= canvas.height
        ) {
            continue;
        }


        const pixelIndex =
            y * canvas.width + x;


        if (visited[pixelIndex]) {
            continue;
        }


        visited[pixelIndex] = 1;


        const dataIndex =
            pixelIndex * 4;


        const r =
            data[dataIndex];

        const g =
            data[dataIndex + 1];

        const b =
            data[dataIndex + 2];


        const brightness =
            (r + g + b) / 3;


        /*
            Las líneas permanecen intactas.
        */

        if (
            brightness <
            LINE_THRESHOLD
        ) {
            continue;
        }


        /*
            Permitimos zonas claras.
        */

        if (
            brightness >=
            LINE_THRESHOLD
        ) {

            pixelsToPaint.push(
                pixelIndex
            );


            stack.push([
                x + 1,
                y
            ]);

            stack.push([
                x - 1,
                y
            ]);

            stack.push([
                x,
                y + 1
            ]);

            stack.push([
                x,
                y - 1
            ]);
        }
    }


    /*
        Evitar pintar toda la imagen
    */

    const maxPixels =
        canvas.width *
        canvas.height *
        MAX_FILL_RATIO;


    if (
        pixelsToPaint.length >
        maxPixels
    ) {

        return;
    }


    /*
        Si no encontramos píxeles
    */

    if (
        pixelsToPaint.length === 0
    ) {
        return;
    }


    /*
        Guardar estado para deshacer
    */

    saveHistory();


    /*
        Pintar
    */

    pixelsToPaint.forEach(
        pixelIndex => {

            const i =
                pixelIndex * 4;


            data[i] =
                rgb.r;

            data[i + 1] =
                rgb.g;

            data[i + 2] =
                rgb.b;

            data[i + 3] =
                255;
        }
    );


    ctx.putImageData(
        imageData,
        0,
        0
    );


    /*
        Recuperar las líneas originales
        para que sigan viéndose negras.
    */

    redrawLineArt();


    paintedPixels +=
        pixelsToPaint.length;


    updateProgress();
}


/* =========================
   RECUPERAR LÍNEAS
========================= */

function redrawLineArt() {

    if (!originalImageData) {
        return;
    }


    const current =
        ctx.getImageData(
            0,
            0,
            canvas.width,
            canvas.height
        );


    const original =
        originalImageData.data;

    const currentData =
        current.data;


    for (
        let i = 0;
        i < original.length;
        i += 4
    ) {

        const brightness =
            (
                original[i] +
                original[i + 1] +
                original[i + 2]
            ) / 3;


        if (
            brightness <
            LINE_THRESHOLD
        ) {

            currentData[i] =
                original[i];

            currentData[i + 1] =
                original[i + 1];

            currentData[i + 2] =
                original[i + 2];

            currentData[i + 3] =
                original[i + 3];
        }
    }


    ctx.putImageData(
        current,
        0,
        0
    );
}


/* =========================
   CALCULAR ZONAS PINTABLES
========================= */

function calculatePaintablePixels() {

    if (!originalImageData) {
        return;
    }


    const data =
        originalImageData.data;


    totalPaintablePixels = 0;


    for (
        let i = 0;
        i < data.length;
        i += 4
    ) {

        const brightness =
            (
                data[i] +
                data[i + 1] +
                data[i + 2]
            ) / 3;


        if (
            brightness >=
            WHITE_THRESHOLD
        ) {

            totalPaintablePixels++;
        }
    }
}


/* =========================
   PROGRESO
========================= */

function updateProgress() {

    if (
        totalPaintablePixels <= 0
    ) {

        progressText.textContent =
            "0%";

        return;
    }


    let percentage =
        Math.round(
            (
                paintedPixels /
                totalPaintablePixels
            ) * 100
        );


    percentage =
        Math.max(
            0,
            Math.min(
                100,
                percentage
            )
        );


    progressText.textContent =
        percentage + "%";
}


/* =========================
   HISTORIAL
========================= */

function saveHistory() {

    const current =
        ctx.getImageData(
            0,
            0,
            canvas.width,
            canvas.height
        );


    history.push(
        new ImageData(
            new Uint8ClampedArray(
                current.data
            ),
            current.width,
            current.height
        )
    );


    /*
        Limitar memoria
    */

    if (history.length > 20) {

        history.shift();
    }
}


/* =========================
   DESHACER
========================= */

undoBtn.addEventListener(
    "click",
    () => {

        if (
            history.length <= 1
        ) {
            return;
        }


        history.pop();


        const previous =
            history[
                history.length - 1
            ];


        ctx.putImageData(
            previous,
            0,
            0
        );


        /*
            Recalcular aproximadamente
            el progreso.
        */

        calculateCurrentProgress();
    }
);


/* =========================
   CALCULAR PROGRESO ACTUAL
========================= */

function calculateCurrentProgress() {

    if (!originalImageData) {
        return;
    }


    const current =
        ctx.getImageData(
            0,
            0,
            canvas.width,
            canvas.height
        );


    const original =
        originalImageData.data;

    const data =
        current.data;


    paintedPixels = 0;


    for (
        let i = 0;
        i < data.length;
        i += 4
    ) {

        const originalBrightness =
            (
                original[i] +
                original[i + 1] +
                original[i + 2]
            ) / 3;


        if (
            originalBrightness >=
            WHITE_THRESHOLD
        ) {

            const difference =
                Math.abs(
                    data[i] -
                    original[i]
                ) +
                Math.abs(
                    data[i + 1] -
                    original[i + 1]
                ) +
                Math.abs(
                    data[i + 2] -
                    original[i + 2]
                );


            if (
                difference > 30
            ) {

                paintedPixels++;
            }
        }
    }


    updateProgress();
}


/* =========================
   REINICIAR
========================= */

resetBtn.addEventListener(
    "click",
    () => {

        if (!originalImageData) {
            return;
        }


        ctx.putImageData(
            originalImageData,
            0,
            0
        );


        history = [
            new ImageData(
                new Uint8ClampedArray(
                    originalImageData.data
                ),
                originalImageData.width,
                originalImageData.height
            )
        ];


        paintedPixels = 0;

        progressText.textContent =
            "0%";
    }
);


/* =========================
   GUARDAR DIBUJO
========================= */

saveBtn.addEventListener(
    "click",
    () => {

        canvas.toBlob(
            blob => {

                if (!blob) {
                    return;
                }


                const link =
                    document.createElement(
                        "a"
                    );


                const url =
                    URL.createObjectURL(
                        blob
                    );


                link.href = url;


                link.download =
                    "snoopy-coloreado.png";


                document.body.appendChild(
                    link
                );


                link.click();


                link.remove();


                URL.revokeObjectURL(
                    url
                );

            },
            "image/png"
        );
    }
);


/* =========================
   HEX → RGB
========================= */

function hexToRgb(hex) {

    hex =
        hex.replace("#", "");


    if (hex.length === 3) {

        hex =
            hex
                .split("")
                .map(char => char + char)
                .join("");
    }


    const number =
        parseInt(
            hex,
            16
        );


    return {

        r:
            (number >> 16) & 255,

        g:
            (number >> 8) & 255,

        b:
            number & 255
    };
}


/* =========================
   UTILIDAD
========================= */

function clamp(
    value,
    min,
    max
) {

    return Math.max(
        min,
        Math.min(
            max,
            value
        )
    );
}