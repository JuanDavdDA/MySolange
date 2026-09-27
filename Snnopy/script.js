// ================================
// BOTÓN INICIAL
// ================================

const startBtn = document.getElementById("startBtn");

startBtn.addEventListener("click", () => {
    document.querySelector(".letter-section").scrollIntoView({
        behavior: "smooth"
    });

    createHearts(12);
});


// ================================
// VENTANA DE SORPRESA
// ================================

const surprise = document.getElementById("surprise");
const surpriseBtn = document.getElementById("surpriseBtn");
const close = document.getElementById("close");
const closeBtn = document.getElementById("closeBtn");

function openSurprise() {
    surprise.classList.add("active");
    createHearts(25);
}

function closeSurprise() {
    surprise.classList.remove("active");
}

surpriseBtn.addEventListener("click", openSurprise);
close.addEventListener("click", closeSurprise);
closeBtn.addEventListener("click", closeSurprise);


// ================================
// CERRAR AL HACER CLIC FUERA
// ================================

surprise.addEventListener("click", (event) => {
    if (event.target === surprise) {
        closeSurprise();
    }
});


// ================================
// CORAZONES FLOTANTES
// ================================

function createHeart() {
    const heart = document.createElement("div");

    heart.classList.add("heart-floating");

    heart.innerHTML = Math.random() > 0.5 ? "♥" : "♡";

    heart.style.left = Math.random() * 100 + "vw";

    heart.style.fontSize =
        Math.random() * 20 + 15 + "px";

    heart.style.animationDuration =
        Math.random() * 3 + 4 + "s";

    document.body.appendChild(heart);

    setTimeout(() => {
        heart.remove();
    }, 7000);
}

function createHearts(amount = 5) {
    for (let i = 0; i < amount; i++) {
        setTimeout(() => {
            createHeart();
        }, i * 120);
    }
}


// ================================
// CORAZONES OCASIONALES
// ================================

setInterval(() => {
    if (Math.random() > 0.45) {
        createHeart();
    }
}, 2500);


// ================================
// EFECTO PARALLAX SUAVE
// ================================

window.addEventListener("mousemove", (event) => {
    const snoopy = document.querySelector(".snoopy");

    if (!snoopy) return;

    const x =
        (event.clientX / window.innerWidth - 0.5) * 10;

    const y =
        (event.clientY / window.innerHeight - 0.5) * 10;

    snoopy.style.transform =
        `translate(${x}px, ${y}px)`;
});


// ================================
// TECLADO
// ================================

document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
        closeSurprise();
    }
});


// ================================
// VIDEO SNOOPY
// ================================

const video = document.getElementById("snoopyVideo");
const container =
    document.getElementById("snoopyVideoContainer");

const soundHint =
    document.getElementById("soundHint");

container.addEventListener("click", () => {

    if (video.muted) {

        video.muted = false;
        video.volume = 1;
        video.play();

        container.classList.add("playing");

    } else {

        video.muted = true;

        container.classList.remove("playing");
    }

});