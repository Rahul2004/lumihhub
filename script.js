/* LUMINA HUB - CORE SCRIPT */

// 1. Page & Navigation
const navBtns = document.querySelectorAll(".nav-btn");
const pages = document.querySelectorAll(".page-view");

navBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    const pageId = btn.getAttribute("data-page");
    navBtns.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    pages.forEach((page) => {
      page.classList.remove("active");
      if (page.id === `${pageId}-page`) page.classList.add("active");
    });
  });
});

// 2. Image Editor Logic
const filters = {
  brightness: { value: 100, unit: "%", max: 200, min: 0 },
  contrast: { value: 100, unit: "%", max: 200, min: 0 },
  saturate: { value: 100, unit: "%", max: 200, min: 0 },
  "hue-rotate": { value: 0, unit: "deg", max: 360, min: 0 },
  blur: { value: 0, unit: "px", max: 10, min: 0 },
  grayscale: { value: 0, unit: "%", max: 100, min: 0 },
  sepia: { value: 0, unit: "%", max: 100, min: 0 },
  opacity: { value: 100, unit: "%", max: 100, min: 0 },
  invert: { value: 0, unit: "%", max: 100, min: 0 },
};

const filtersContainer = document.getElementById("filters-container");
const imageInput = document.getElementById("image-input");
const imageCanvas = document.getElementById("image-canvas");
const ctx = imageCanvas.getContext("2d");
const placeholder = document.querySelector(".placeholder");

let originalImage = null;

function initEditor() {
  if (!filtersContainer) return;
  filtersContainer.innerHTML = "";
  Object.keys(filters).forEach((key) => {
    const group = document.createElement("div");
    group.className = "filter-group";
    group.innerHTML = `
      <div class="filter-header">
        <label>${key}</label>
        <span>${filters[key].value}${filters[key].unit}</span>
      </div>
      <input type="range" id="input-${key}" min="${filters[key].min}" max="${filters[key].max}" value="${filters[key].value}" />
    `;
    const input = group.querySelector("input");
    const span = group.querySelector("span");
    input.addEventListener("input", (e) => {
      filters[key].value = e.target.value;
      span.innerText = `${e.target.value}${filters[key].unit}`;
      applyFilters();
    });
    filtersContainer.appendChild(group);
  });
}

initEditor();

if (imageInput) {
  imageInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      originalImage = new Image();
      originalImage.onload = () => {
        const container = imageCanvas.parentElement;
        const ratio = Math.min(container.clientWidth / originalImage.width, container.clientHeight / originalImage.height);
        imageCanvas.width = originalImage.width * ratio;
        imageCanvas.height = originalImage.height * ratio;
        placeholder.style.display = "none";
        imageCanvas.style.display = "block";
        applyFilters();
      };
      originalImage.src = event.target.result;
    };
    reader.readAsDataURL(file);
  });
}

function applyFilters() {
  if (!originalImage) return;
  const filterStrings = Object.keys(filters).map(k => `${k}(${filters[k].value}${filters[k].unit})`).join(" ");
  ctx.filter = filterStrings;
  ctx.clearRect(0, 0, imageCanvas.width, imageCanvas.height);
  ctx.drawImage(originalImage, 0, 0, imageCanvas.width, imageCanvas.height);
}

document.getElementById("reset-btn")?.addEventListener("click", () => {
  Object.keys(filters).forEach(k => {
    filters[k].value = ["brightness", "contrast", "saturate", "opacity"].includes(k) ? 100 : 0;
    const input = document.getElementById(`input-${k}`);
    const span = input.previousElementSibling.querySelector("span");
    input.value = filters[k].value;
    span.innerText = `${filters[k].value}${filters[k].unit}`;
  });
  applyFilters();
});

document.getElementById("download-btn")?.addEventListener("click", () => {
  if (!originalImage) return;
  const formatSelect = document.getElementById("format-select");
  const link = document.createElement("a");
  link.download = `lumina-export.${formatSelect.value}`;
  link.href = imageCanvas.toDataURL(`image/${formatSelect.value === 'jpeg' ? 'jpeg' : 'png'}`);
  link.click();
});

// 3. Toolbox Hub Logic
const toolCards = document.querySelectorAll(".c-card");
const toolModal = document.getElementById("tool-modal");
const modalContent = document.getElementById("modal-content-inject");

toolCards.forEach(card => {
  card.addEventListener("click", () => {
    const type = card.getAttribute("data-type");
    const title = card.querySelector("h3").innerText;
    openTool(type, title);
  });
});

async function openTool(type, title) {
  modalContent.innerHTML = getToolTemplate(type, title);
  toolModal.classList.add("active");
  initToolLogic(type);
}

document.querySelector(".close-modal")?.addEventListener("click", () => toolModal.classList.remove("active"));

function getToolTemplate(type, title) {
  if (type === "qr-generator") {
    return `
      <div style="text-align:center;">
        <h2 style="margin-bottom:1rem;">${title}</h2>
        <input type="text" id="qr-data" placeholder="Paste link or text..." style="width:100%; padding:15px; border-radius:12px; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); color:white; margin-bottom:1rem;" />
        <button class="btn btn-accent" id="gen-qr" style="width:100%;">Create QR Code</button>
        <div id="qr-result" style="margin-top:2rem; min-height:200px; display:flex; align-items:center; justify-content:center;"></div>
      </div>
    `;
  }
  if (type === "bg-remover") {
    return `
      <div style="text-align:center;">
        <h2 style="margin-bottom:0.5rem;">${title}</h2>
        <p style="font-size:0.8rem; margin-bottom:1rem; color:var(--color-text-secondary);">Automatic detection or manual click-to-erase</p>
        <div class="drop-area" id="bg-drop" style="min-height:100px; padding:20px;">
          <input type="file" id="bg-input" hidden accept="image/*" />
          <i class="ri-magic-fill"></i>
          <p>Drop Image or Click to begin AI Scan</p>
        </div>
        <div id="eraser-workspace" style="display:none; margin-top:1rem;">
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:1rem;">
             <button class="btn btn-accent" id="ai-scan-btn"><i class="ri-scan-2-line"></i> Run AI Auto-Detect</button>
             <div style="background:rgba(255,255,255,0.05); padding:5px; border-radius:12px; display:flex; align-items:center; gap:10px; justify-content:center;">
               <input type="range" id="bg-tolerance" min="0" max="150" value="40" style="flex:1;" />
             </div>
          </div>
          <div style="position:relative; max-height:400px; overflow:auto; border-radius:12px; background:radial-gradient(circle, #222 10%, transparent 10%) center / 15px 15px; border:1px solid rgba(255,255,255,0.1);">
             <canvas id="eraser-canvas" style="display:block; margin:0 auto; cursor:crosshair;"></canvas>
             <div id="ai-loader" style="position:absolute; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.8); display:none; flex-direction:column; align-items:center; justify-content:center; gap:10px;">
                <div class="status-ring active" style="width:40px; height:40px;"></div>
                <p style="font-size:0.7rem; color:var(--color-accent);">AI IS DETECTING OBJECTS...</p>
             </div>
          </div>
          <div style="margin-top:1.5rem; display:flex; gap:10px;">
            <button class="btn" id="eraser-reset" style="flex:1;">Full Reset</button>
             <button class="btn btn-accent" id="eraser-dl" style="flex:1;">Download PNG</button>
          </div>
        </div>
      </div>
    `;
  }
  if (type === "color-palette") {
    return `
      <div style="text-align:center;">
        <h2 style="margin-bottom:1rem;">${title}</h2>
        <div class="drop-area" id="palette-drop">
          <i class="ri-palette-line"></i>
          <p>Instant color extraction</p>
          <input type="file" id="palette-input" hidden accept="image/*" />
        </div>
        <div id="palette-result" style="display:grid; grid-template-columns:repeat(5, 1fr); gap:10px; margin-top:1rem;"></div>
      </div>
    `;
  }
  return `
    <div style="text-align:center;">
      <h2 style="margin-bottom:1rem;">${title}</h2>
      <div class="drop-area" id="tool-drop">
        <i class="ri-upload-cloud-2-line"></i>
        <p>Drop file(s) for instant conversion</p>
        <input type="file" id="tool-input" hidden multiple />
      </div>
      <div class="status-ring" id="status-ring" style="display:none;"><div class="progress-fill" id="p-fill" style="width:100%;"></div></div>
      <p id="s-text" style="font-size:0.9rem; margin:1rem 0; color:var(--color-text-secondary);"></p>
      <button class="btn btn-accent" id="tool-process" style="width:100%;" disabled>Convert Now</button>
    </div>
  `;
}

function initToolLogic(type) {
  if (type === "bg-remover") {
    const drop = document.getElementById("bg-drop");
    const input = document.getElementById("bg-input");
    const workspace = document.getElementById("eraser-workspace");
    const canvas = document.getElementById("eraser-canvas");
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    let originalData = null;

    drop.onclick = () => input.click();
    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const img = await loadImage(file);
        const max = 600;
        const ratio = Math.min(max/img.width, max/img.height);
        canvas.width = img.width * ratio; canvas.height = img.height * ratio;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        originalData = ctx.getImageData(0,0,canvas.width, canvas.height);
        drop.style.display = "none";
        workspace.style.display = "block";
    };

    canvas.onclick = (e) => {
        if (!originalData) return;
        const rect = canvas.getBoundingClientRect();
        const scX = canvas.width / rect.width;
        const scY = canvas.height / rect.height;
        const x = Math.floor((e.clientX - rect.left) * scX);
        const y = Math.floor((e.clientY - rect.top) * scY);
        
        const imgData = ctx.getImageData(0,0,canvas.width, canvas.height);
        const pix = imgData.data;
        const idx = (y * canvas.width + x) * 4;
        const targetR = pix[idx], targetG = pix[idx+1], targetB = pix[idx+2];
        const tolerance = parseInt(document.getElementById("bg-tolerance").value);

        for (let i = 0; i < pix.length; i += 4) {
            const dr = Math.abs(pix[i] - targetR);
            const dg = Math.abs(pix[i+1] - targetG);
            const db = Math.abs(pix[i+2] - targetB);
            if (dr < tolerance && dg < tolerance && db < tolerance) {
                pix[i + 3] = 0;
            }
        }
        ctx.putImageData(imgData, 0, 0);
    };

    document.getElementById("ai-scan-btn").onclick = async () => {
        const loader = document.getElementById("ai-loader");
        loader.style.display = "flex";
        try {
            if (!window.bodyPix) throw new Error("AI Model not loaded");
            const net = await bodyPix.load({
                architecture: 'MobileNetV1',
                outputStride: 16,
                multiplier: 0.75,
                quantBytes: 2
            });
            const segmentation = await net.segmentPerson(canvas, {
                internalResolution: 'medium',
                segmentationThreshold: 0.7
            });
            
            const imgData = ctx.getImageData(0,0,canvas.width, canvas.height);
            const pix = imgData.data;
            for (let i = 0; i < pix.length; i += 4) {
                if (segmentation.data[i / 4] === 0) { // 0 is background
                    pix[i + 3] = 0;
                }
            }
            ctx.putImageData(imgData, 0, 0);
        } catch (err) {
            alert("AI Scan failed. Please use manual click-to-erase.");
            console.error(err);
        }
        loader.style.display = "none";
    };

    document.getElementById("eraser-reset").onclick = () => ctx.putImageData(originalData, 0, 0);
    document.getElementById("eraser-dl").onclick = () => {
        canvas.toBlob(b => downloadFile(b, "lumina_magic_transparent.png", "blob"), "image/png");
    };

  } else if (type === "qr-generator") {
    const btn = document.getElementById("gen-qr");
    const input = document.getElementById("qr-data");
    const result = document.getElementById("qr-result");
    
    // Enhanced QR Logic with Download
    input.oninput = () => {
        if (!input.value) { result.innerHTML = ""; return; }
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(input.value)}`;
        result.innerHTML = `
            <div style="background: white; padding: 20px; border-radius: 12px; display: inline-block; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
                <img id="qr-img" src="${qrUrl}" style="display:block; width:250px; height:250px; animation: scaleIn 0.3s ease;" />
            </div>
            <div style="margin-top:20px;">
                <button class="btn btn-accent" id="dl-qr" style="width:100%;">
                    <i class="ri-download-2-line"></i> Download HD QR Code
                </button>
            </div>
        `;
        
        document.getElementById("dl-qr").onclick = async () => {
            const btn = document.getElementById("dl-qr");
            btn.innerText = "Downloading...";
            try {
                const response = await fetch(qrUrl);
                const blob = await response.blob();
                const link = document.createElement("a");
                link.href = URL.createObjectURL(blob);
                link.download = "lumina_qr_code.png";
                link.click();
                btn.innerHTML = `<i class="ri-check-line"></i> Downloaded!`;
            } catch (e) {
                btn.innerText = "Error Downloading";
            }
        };
    };
    btn.onclick = () => input.oninput();
  } else if (type === "color-palette") {
    const drop = document.getElementById("palette-drop");
    const input = document.getElementById("palette-input");
    const result = document.getElementById("palette-result");
    drop.onclick = () => input.click();
    input.onchange = (e) => {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const c = canvas.getContext("2d");
          canvas.width = 100; canvas.height = 100;
          c.drawImage(img, 0, 0, 100, 100);
          const data = c.getImageData(0,0,100,100).data;
          const colors = [];
          for(let i=0; i<data.length; i+=1000) colors.push(`rgb(${data[i]}, ${data[i+1]}, ${data[i+2]})`);
          result.innerHTML = [...new Set(colors)].slice(0, 10).map(col => `
            <div style="height:60px; background:${col}; border-radius:8px; animation: scaleIn 0.3s ease; display:flex; align-items:center; justify-content:center; font-size:0.6rem; color:white; font-weight:bold; cursor:pointer;" onclick="navigator.clipboard.writeText('${col}'); this.innerText='COPIED!'">COPY</div>
          `).join("");
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    };
  } else {
    const drop = document.getElementById("tool-drop");
    const input = document.getElementById("tool-input");
    const processBtn = document.getElementById("tool-process");
    let files = [];
    
    // Support Click to Browse
    drop.onclick = () => input.click();

    // Support Drag & Drop
    drop.ondragover = (e) => { e.preventDefault(); drop.style.borderColor = "var(--color-accent)"; };
    drop.ondragleave = () => { drop.style.borderColor = "var(--border-glass)"; };
    drop.ondrop = (e) => {
        e.preventDefault();
        drop.style.borderColor = "var(--border-glass)";
        files = Array.from(e.dataTransfer.files);
        handleFileSelection(files, drop, processBtn);
    };

    input.onchange = (e) => {
      files = Array.from(e.target.files);
      handleFileSelection(files, drop, processBtn);
    };

    processBtn.onclick = () => {
        if (files.length > 0) runToolFlow(type, files);
    };
  }
}

function handleFileSelection(files, drop, btn) {
    if (files.length > 0) {
        drop.querySelector("p").innerText = `${files.length} file(s) ready for processing!`;
        btn.disabled = false;
        btn.classList.add("btn-accent");
        drop.style.background = "rgba(59, 130, 246, 0.05)";
    }
}

async function runToolFlow(type, files) {
  const sText = document.getElementById("s-text");
  if (!sText) return;
  sText.innerText = "Connecting to conversion core...";

  try {
    const file = files[0];
    const fileName = (file && file.name) ? file.name.split(".")[0] : "lumina_result";

    // --- Image Swapping ---
    if (type === "jpg-to-png" || type === "png-to-jpg") {
      sText.innerText = "Encoding pixel data...";
      const img = await loadImage(file);
      const canvas = document.createElement("canvas");
      canvas.width = img.width; canvas.height = img.height;
      canvas.getContext("2d").drawImage(img, 0, 0);
      const ext = type.endsWith("png") ? "png" : "jpeg";
      canvas.toBlob((b) => downloadFile(b, `${fileName}.${ext}`, "blob"), `image/${ext}`);
    } 
    // --- Data Transformers ---
    else if (type === "json-to-csv") {
        const text = await file.text();
        const json = JSON.parse(text);
        const keys = Object.keys(json[0] || json);
        const csv = [keys.join(","), ... (Array.isArray(json) ? json : [json]).map(row => keys.map(k => row[k]).join(","))].join("\n");
        downloadFile(new Blob([csv], { type: "text/csv" }), `${fileName}.csv`, "blob");
    }
    else if (type === "csv-to-json") {
        const text = await file.text();
        const rows = text.split("\n").filter(r => r.trim());
        const headers = rows[0].split(",");
        const json = rows.slice(1).map(row => {
            const values = row.split(",");
            return headers.reduce((acc, h, i) => ({ ...acc, [h.trim()]: values[i] || "" }), {});
        });
        downloadFile(new Blob([JSON.stringify(json, null, 2)], { type: "application/json" }), `${fileName}.json`, "blob");
    }
    // --- Advanced Tools ---
    else if (type === "image-compress") {
        sText.innerText = "Optimizing quality layers...";
        const img = await loadImage(file);
        const canvas = document.createElement("canvas");
        const scale = 0.8; 
        canvas.width = img.width * scale; canvas.height = img.height * scale;
        canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((b) => downloadFile(b, `${fileName}_compressed.jpg`, "blob"), "image/jpeg", 0.5);
    }
    else if (type === "image-to-pdf") {
      if (!window.jspdf) throw new Error("PDF Library failed to load");
      const { jsPDF } = window.jspdf;
      let pdf = null;
      for (let i = 0; i < files.length; i++) {
          sText.innerText = `Merging image ${i+1}/${files.length}`;
          const img = await loadImage(files[i]);
          if (i===0) pdf = new jsPDF({ orientation: img.width>img.height?'l':'p', unit:'px', format:[img.width, img.height]});
          else pdf.addPage([img.width, img.height], img.width>img.height?'l':'p');
          pdf.addImage(img, 'JPEG', 0, 0, img.width, img.height);
      }
      downloadFile(pdf.output("blob"), `${fileName}.pdf`, "blob");
    } 
    else if (type === "pdf-to-text" || type === "pdf-to-word") {
       const pdfjsLib = window.pdfjsLib || window["pdfjs-dist/build/pdf"];
       if (!pdfjsLib) throw new Error("PDF Engine not initialized");
       sText.innerText = "Analyzing file contents...";
       const typedarray = new Uint8Array(await file.arrayBuffer());
       pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js";
       const pdf = await pdfjsLib.getDocument(typedarray).promise;
       let t = "";
       for (let i = 1; i <= pdf.numPages; i++) {
           const page = await pdf.getPage(i);
           const content = await page.getTextContent();
           t += content.items.map(item => item.str).join(" ") + "\n\n";
       }
       if (type === "pdf-to-word") {
           downloadFile(new Blob([`<html><body>${t.replace(/\n/g, "<br>")}</body></html>`], { type: "application/msword" }), `${fileName}.doc`, "blob");
       } else {
           downloadFile(new Blob([t], { type: "text/plain" }), `${fileName}.txt`, "blob");
       }
    }
    else if (type === "pdf-to-jpg") {
        const pdfjsLib = window.pdfjsLib || window["pdfjs-dist/build/pdf"];
        if (!pdfjsLib) throw new Error("PDF Renderer failed");
        if (!window.JSZip) throw new Error("Zip Library missing");
        sText.innerText = `Rasterizing ${fileName}...`;
        const typedarray = new Uint8Array(await file.arrayBuffer());
        pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js";
        const pdf = await pdfjsLib.getDocument(typedarray).promise;
        const zip = new JSZip();
        for (let i = 1; i <= pdf.numPages; i++) {
            sText.innerText = `Processing page ${i}/${pdf.numPages}`;
            const page = await pdf.getPage(i);
            const viewport = page.getViewport({ scale: 1.5 });
            const canv = document.createElement("canvas");
            canv.width = viewport.width; canv.height = viewport.height;
            await page.render({ canvasContext: canv.getContext("2d"), viewport }).promise;
            zip.file(`page_${i}.jpg`, canv.toDataURL("image/jpeg", 0.7).split(",")[1], { base64: true });
        }
        const blob = await zip.generateAsync({ type: "blob", compression: "DEFLATE" });
        downloadFile(blob, `${fileName}_images.zip`, "blob");
    }
    else if (type === "pdf-merge") {
        const pdflibObj = window.PDFLib;
        if (!pdflibObj) throw new Error("Library Core failed");
        const { PDFDocument } = pdflibObj;
        const mergedPdf = await PDFDocument.create();
        for (const f of files) {
            const pdf = await PDFDocument.load(await f.arrayBuffer());
            const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
            copiedPages.forEach((page) => mergedPdf.addPage(page));
        }
        const pdfBytes = await mergedPdf.save();
        downloadFile(new Blob([pdfBytes], { type: "application/pdf" }), "merged_document.pdf", "blob");
    }
    else if (type === "base64-tool") {
        const b64 = await new Promise(r => {
            const rd = new FileReader();
            rd.onload = e => r(e.target.result);
            rd.readAsDataURL(file);
        });
        downloadFile(b64, `${fileName}_base64.txt`, "text/plain");
    }
    
    if (sText) sText.innerText = "Success!";
    setTimeout(() => toolModal.classList.remove("active"), 400);
  } catch (err) {
    if (sText) sText.innerText = "Processing error.";
    console.error(err);
  }
}
// 5. Utility Helpers
function downloadFile(content, name, type) {
    const link = document.createElement("a");
    if (content instanceof Blob) {
        link.href = URL.createObjectURL(content);
    } else {
        link.href = URL.createObjectURL(new Blob([content], { type: type || 'application/octet-stream' }));
    }
    link.download = name;
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 100);
}

async function loadImage(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error("Image load failed"));
            img.src = e.target.result;
        };
        reader.onerror = () => reject(new Error("File read failed"));
        reader.readAsDataURL(file);
    });
}
