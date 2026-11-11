// CloudBox Converter
// Image conversion + Multiple images to PDF/DOCX

const fileInput = document.getElementById("fileInput");
const dropzone = document.getElementById("dropzone");
const browseBtn = document.getElementById("browseBtn");
const selectedFile = document.getElementById("selectedFile");

const fileName = document.getElementById("fileName");
const fileMeta = document.getElementById("fileMeta");
const fileThumb = document.getElementById("fileThumb");

const removeFileBtn = document.getElementById("removeFile");
const outputFormat = document.getElementById("outputFormat");
const formatBadge = document.getElementById("formatBadge");

const convertBtn = document.getElementById("convertBtn");
const convertButtonText = document.getElementById("convertButtonText");

const previewStage = document.getElementById("previewStage");

const progressWrap = document.getElementById("progressWrap");
const progressBar = document.getElementById("progressBar");
const progressText = document.getElementById("progressText");
const progressPercent = document.getElementById("progressPercent");

const resultCard = document.getElementById("resultCard");
const resultMeta = document.getElementById("resultMeta");
const downloadBtn = document.getElementById("downloadBtn");

const toast = document.getElementById("toast");

// AWS API Gateway Configuration
const API_URL = "https://ujx72b3hfl.execute-api.us-east-1.amazonaws.com/upload";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp"
];

let currentFiles = [];
let sourceUrls = [];
let outputUrl = null;


// Toast Message

function showToast(message) {

  toast.textContent = message;

  toast.classList.add("show");

  window.setTimeout(() => {
    toast.classList.remove("show");
  }, 2600);

}


// Format File Size

function formatBytes(bytes) {

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;

}


// Get Extension

function extensionFor(mime) {

  return {
    "image/jpeg": "JPG",
    "image/png": "PNG",
    "image/webp": "WEBP",
    "application/pdf": "PDF",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "DOCX"
  }[mime] || "FILE";

}


// Clear Result

function clearResult() {

  resultCard.classList.add("hidden");
  progressWrap.classList.add("hidden");

  if (outputUrl) {
    URL.revokeObjectURL(outputUrl);
  }

  outputUrl = null;

  downloadBtn.removeAttribute("href");

}


// Reset Files

function resetFile() {

  currentFiles = [];

  fileInput.value = "";

  selectedFile.classList.add("hidden");

  dropzone.classList.remove("hidden");

  convertBtn.disabled = true;

  convertButtonText.textContent = "Convert image";

  sourceUrls.forEach(url => URL.revokeObjectURL(url));

  sourceUrls = [];

  clearResult();

  previewStage.innerHTML = `
    <div class="preview-placeholder">
      <div class="image-placeholder"><span>＋</span></div>
      <strong>Your preview will appear here</strong>
      <p>Upload an image to get started</p>
    </div>
  `;

}


// Accept Multiple Files

function acceptFiles(files) {

  const validFiles = Array.from(files);

  if (!validFiles.length) return;

  if (validFiles.length > 20) {
    showToast("You can select a maximum of 20 images.");
    return;
  }

  for (const file of validFiles) {

    if (!ALLOWED_TYPES.includes(file.type)) {
      showToast("Please choose JPG, PNG or WEBP images only.");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      showToast(`${file.name} is larger than 10 MB.`);
      return;
    }

    if (file.size === 0) {
      showToast(`${file.name} is empty.`);
      return;
    }

  }

  currentFiles = validFiles;

  clearResult();

  sourceUrls.forEach(url => URL.revokeObjectURL(url));

  sourceUrls = currentFiles.map(file => URL.createObjectURL(file));

  updateFileDetails();

  updatePreview();

  selectedFile.classList.remove("hidden");

  dropzone.classList.add("hidden");

  convertBtn.disabled = false;

  showToast(`${currentFiles.length} image(s) added successfully.`);

}


// Update File Information

function updateFileDetails() {

  const totalSize = currentFiles.reduce(
    (total, file) => total + file.size,
    0
  );

  if (currentFiles.length === 1) {

    fileName.textContent = currentFiles[0].name;

    fileMeta.textContent =
      `${extensionFor(currentFiles[0].type)} · ${formatBytes(currentFiles[0].size)}`;

  } else {

    fileName.textContent = `${currentFiles.length} images selected`;

    fileMeta.textContent = `Total size · ${formatBytes(totalSize)}`;

  }

  fileThumb.innerHTML = "";

  const thumb = document.createElement("img");

  thumb.src = sourceUrls[0];

  thumb.alt = "Selected image thumbnail";

  fileThumb.appendChild(thumb);

}


// Preview Images

function updatePreview() {

  previewStage.innerHTML = "";

  if (currentFiles.length === 1) {

    const preview = document.createElement("img");

    preview.className = "preview-image";

    preview.src = sourceUrls[0];

    preview.alt = "Image preview";

    previewStage.appendChild(preview);

  } else {

    const container = document.createElement("div");

    container.className = "preview-multiple";

    sourceUrls.forEach(url => {

      const image = document.createElement("img");

      image.src = url;

      image.alt = "Selected image";

      container.appendChild(image);

    });

    previewStage.appendChild(container);

  }

}


// Update Output Format

function updateFormat() {

  const ext = extensionFor(outputFormat.value);

  formatBadge.textContent = ext;

  if (outputFormat.value === "application/pdf") {

    convertButtonText.textContent = "Create PDF";

  } else if (
    outputFormat.value ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {

    convertButtonText.textContent = "Create DOCX";

  } else {

    convertButtonText.textContent = "Convert image";

  }

  clearResult();

}


// Progress

function setProgress(percent, message) {

  progressWrap.classList.remove("hidden");

  progressBar.style.width = `${percent}%`;

  progressPercent.textContent = `${percent}%`;

  progressText.textContent = message;

}


// Load Image

async function loadImage(file) {

  const url = URL.createObjectURL(file);

  try {

    const image = new Image();

    image.src = url;

    await image.decode();

    return image;

  } finally {

    URL.revokeObjectURL(url);

  }

}


// Convert Single Image

async function convertImage(file, format) {

  const image = await loadImage(file);

  const canvas = document.createElement("canvas");

  canvas.width = image.naturalWidth;

  canvas.height = image.naturalHeight;

  const ctx = canvas.getContext("2d");

  if (format === "image/jpeg") {

    ctx.fillStyle = "#ffffff";

    ctx.fillRect(0, 0, canvas.width, canvas.height);

  }

  ctx.drawImage(image, 0, 0);

  return await new Promise((resolve, reject) => {

    canvas.toBlob(

      result => {

        if (result) {
          resolve(result);
        } else {
          reject(new Error("Image conversion failed."));
        }

      },

      format,

      0.92

    );

  });

}


// Convert Multiple Images to PDF

async function convertImagesToPDF() {

  const { jsPDF } = window.jspdf;

  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4"
  });

  for (let i = 0; i < currentFiles.length; i++) {

    setProgress(
      Math.round(((i + 1) / currentFiles.length) * 85),
      `Adding image ${i + 1} of ${currentFiles.length} to PDF...`
    );

    const image = await loadImage(currentFiles[i]);

    if (i > 0) {
      pdf.addPage();
    }

    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 10;

    const availableWidth = pageWidth - margin * 2;
    const availableHeight = pageHeight - margin * 2;

    const ratio = Math.min(
      availableWidth / image.naturalWidth,
      availableHeight / image.naturalHeight
    );

    const width = image.naturalWidth * ratio;
    const height = image.naturalHeight * ratio;

    const x = (pageWidth - width) / 2;
    const y = (pageHeight - height) / 2;

    const canvas = document.createElement("canvas");

    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;

    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.drawImage(image, 0, 0);

    const imageData = canvas.toDataURL("image/jpeg", 0.95);

    pdf.addImage(
      imageData,
      "JPEG",
      x,
      y,
      width,
      height
    );

  }

  return pdf.output("blob");

}


// Convert Multiple Images to DOCX

async function convertImagesToDOCX() {

  const children = [];

  for (let i = 0; i < currentFiles.length; i++) {

    setProgress(
      Math.round(((i + 1) / currentFiles.length) * 85),
      `Adding image ${i + 1} of ${currentFiles.length} to DOCX...`
    );

    const image = await loadImage(currentFiles[i]);

    const canvas = document.createElement("canvas");

    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;

    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.drawImage(image, 0, 0);

    const blob = await new Promise(resolve => {

      canvas.toBlob(resolve, "image/png");

    });

    if (!blob) {
      throw new Error("Unable to process one of the images.");
    }

    const imageBuffer = await blob.arrayBuffer();

    children.push(

      new docx.Paragraph({

        children: [

          new docx.ImageRun({

            data: imageBuffer,

            transformation: {

              width: Math.min(image.naturalWidth, 450),

              height: Math.min(
                image.naturalHeight,
                600
              )

            }

          })

        ]

      })

    );

    // Add spacing between images

    children.push(new docx.Paragraph({ text: "" }));

  }

  const worddocument = new docx.Document({

    sections: [

      {

        properties: {},

        children: children

      }

    ]

  });

  return await docx.Packer.toBlob(worddocument);

}

async function uploadToAWS(blob, filename) {
    const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => {
            resolve(reader.result.split(",")[1]);
        };

        reader.onerror = () => reject(
            new Error("File reading failed")
        );

        reader.readAsDataURL(blob);
    });

    const response = await fetch(API_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            file_name: filename,
            file_base64: base64,
            content_type: blob.type || "application/octet-stream"
        })
    });

    const result = await response.json();

    if (!response.ok) {
        throw new Error(result.message || "AWS upload failed");
    }

    return result;
}

// Main Conversion Function

async function convertLocally() {

  if (!currentFiles.length) return;

  const format = outputFormat.value;

  convertBtn.disabled = true;

  resultCard.classList.add("hidden");

  setProgress(10, "Preparing files...");

  try {

    let blob;

    let extension;

    // PDF Conversion

    if (format === "application/pdf") {

      blob = await convertImagesToPDF();

      extension = "pdf";

    }

    // DOCX Conversion

    else if (
      format ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {

      blob = await convertImagesToDOCX();

      extension = "docx";

    }

    // Image Conversion

    else {

      if (currentFiles.length > 1) {

        showToast("For multiple images, select PDF or DOCX.");

        return;

      }

      if (currentFiles[0].type === format) {

        showToast("The image is already in that format.");

        return;

      }

      setProgress(35, "Converting image...");

      blob = await convertImage(currentFiles[0], format);

      extension = extensionFor(format).toLowerCase();

    }

    const baseName =
      currentFiles.length > 1
        ? "CloudBox-Converted"
        : currentFiles[0].name.replace(/\.[^.]+$/, "");

    const outputFileName = `${baseName}-converted.${extension}`;

    if (outputUrl) {
      URL.revokeObjectURL(outputUrl);
    }

    outputUrl = URL.createObjectURL(blob);

    downloadBtn.href = outputUrl;
    downloadBtn.download = outputFileName;

    setProgress(90, "Uploading to AWS S3...");

    try {

      await uploadToAWS(blob, outputFileName);

    } catch (error) {

      console.warn("AWS upload failed; using local download instead.", error);

      setProgress(95, "Local download ready");
      showToast("Cloud upload unavailable. Your file is ready to download locally.");

    }

    resultMeta.textContent =
      `${formatBytes(blob.size)} · ${extension.toUpperCase()} file`;

    setProgress(100, "Conversion complete");

    resultCard.classList.remove("hidden");

    showToast("Your converted file is ready!");

  } catch (error) {

    console.error(error);

    showToast(error.message || "Conversion failed.");

  } finally {

    convertBtn.disabled = false;

  }

}


// Browse Files

browseBtn.addEventListener("click", event => {

  event.stopPropagation();

  fileInput.click();

});


// Click Upload Area

dropzone.addEventListener("click", () => {

  fileInput.click();

});


// Keyboard Support

dropzone.addEventListener("keydown", event => {

  if (event.key === "Enter" || event.key === " ") {

    event.preventDefault();

    fileInput.click();

  }

});


// File Input

fileInput.addEventListener("change", event => {

  acceptFiles(event.target.files);

});


// Remove Files

removeFileBtn.addEventListener("click", resetFile);


// Format Change

outputFormat.addEventListener("change", updateFormat);


// Convert Button

convertBtn.addEventListener("click", convertLocally);


// Drag and Drop

["dragenter", "dragover"].forEach(eventName => {

  dropzone.addEventListener(eventName, event => {

    event.preventDefault();

    dropzone.classList.add("dragover");

  });

});


["dragleave", "drop"].forEach(eventName => {

  dropzone.addEventListener(eventName, event => {

    event.preventDefault();

    dropzone.classList.remove("dragover");

  });

});


dropzone.addEventListener("drop", event => {

  acceptFiles(event.dataTransfer.files);

});


// Initial Format Setup

updateFormat();