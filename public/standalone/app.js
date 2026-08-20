/**
 * VEO3 Local Watermark Remover Pro - App Controller
 * Manages UI interactions, ROI drawing, file uploads, and processing events.
 */

document.addEventListener('DOMContentLoaded', () => {
  const engine = new window.WatermarkEngine();
  
  // UI Elements
  const dropzone = document.getElementById('dropzone');
  const fileInput = document.getElementById('file-input');
  const previewSection = document.getElementById('preview-section');
  const stageWrapper = document.getElementById('stage-wrapper');
  const mediaElement = document.getElementById('media-element');
  const roiBox = document.getElementById('roi-box');
  const btnProcess = document.getElementById('btn-process');
  const progressBar = document.getElementById('progress-bar');
  const statusText = document.getElementById('status-text');
  const btnResetROI = document.getElementById('btn-reset-roi');
  const resultSection = document.getElementById('result-section');
  const splitSlider = document.getElementById('split-slider');
  const splitBefore = document.getElementById('split-before');
  const splitHandle = document.getElementById('split-handle');
  const btnDownload = document.getElementById('btn-download');

  let currentFile = null;
  let currentFileType = 'image';
  let nativeWidth = 1280;
  let nativeHeight = 720;
  let currentROI = { x: 1000, y: 640, width: 220, height: 60 };
  let processedBlob = null;

  // File Upload Handlers
  dropzone.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) handleFile(e.target.files[0]);
  });

  dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('dragover');
  });
  dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('dragover');
    if (e.dataTransfer.files.length > 0) handleFile(e.dataTransfer.files[0]);
  });

  function handleFile(file) {
    currentFile = file;
    currentFileType = file.type.startsWith('video') ? 'video' : 'image';
    const objectUrl = URL.createObjectURL(file);

    dropzone.style.display = 'none';
    previewSection.style.display = 'block';
    resultSection.style.display = 'none';

    if (currentFileType === 'video') {
      mediaElement.outerHTML = `<video id="media-element" src="${objectUrl}" controls playsinline></video>`;
      const video = document.getElementById('media-element');
      video.onloadedmetadata = () => {
        nativeWidth = video.videoWidth;
        nativeHeight = video.videoHeight;
        setDefaultROI();
      };
    } else {
      mediaElement.outerHTML = `<img id="media-element" src="${objectUrl}" alt="Preview" />`;
      const img = document.getElementById('media-element');
      img.onload = () => {
        nativeWidth = img.naturalWidth;
        nativeHeight = img.naturalHeight;
        setDefaultROI();
      };
    }
  }

  function setDefaultROI() {
    const rw = Math.round(nativeWidth * 0.16);
    const rh = Math.round(nativeHeight * 0.08);
    const rx = nativeWidth - rw - Math.round(nativeWidth * 0.025);
    const ry = nativeHeight - rh - Math.round(nativeHeight * 0.035);
    currentROI = { x: rx, y: ry, width: rw, height: rh };
    renderROI();
  }

  function renderROI() {
    const rect = stageWrapper.getBoundingClientRect();
    const scaleX = rect.width / nativeWidth;
    const scaleY = rect.height / nativeHeight;

    roiBox.style.left = `${currentROI.x * scaleX}px`;
    roiBox.style.top = `${currentROI.y * scaleY}px`;
    roiBox.style.width = `${currentROI.width * scaleX}px`;
    roiBox.style.height = `${currentROI.height * scaleY}px`;
    roiBox.querySelector('.roi-box-label').textContent = `ROI: ${currentROI.width}x${currentROI.height} (${currentROI.x}, ${currentROI.y})`;
  }

  // Interactive ROI Drag & Draw
  let isDragging = false;
  let startX = 0, startY = 0;

  stageWrapper.addEventListener('mousedown', (e) => {
    if (e.target.closest('.btn')) return;
    isDragging = true;
    const rect = stageWrapper.getBoundingClientRect();
    startX = (e.clientX - rect.left) * (nativeWidth / rect.width);
    startY = (e.clientY - rect.top) * (nativeHeight / rect.height);
    currentROI = { x: Math.round(startX), y: Math.round(startY), width: 10, height: 10 };
    renderROI();
  });

  window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const rect = stageWrapper.getBoundingClientRect();
    const currX = (e.clientX - rect.left) * (nativeWidth / rect.width);
    const currY = (e.clientY - rect.top) * (nativeHeight / rect.height);

    const x1 = Math.min(startX, currX);
    const y1 = Math.min(startY, currY);
    const x2 = Math.max(startX, currX);
    const y2 = Math.max(startY, currY);

    currentROI = {
      x: Math.max(0, Math.round(x1)),
      y: Math.max(0, Math.round(y1)),
      width: Math.max(4, Math.round(x2 - x1)),
      height: Math.max(4, Math.round(y2 - y1)),
    };
    renderROI();
  });

  window.addEventListener('mouseup', () => {
    isDragging = false;
  });

  btnResetROI.addEventListener('click', setDefaultROI);

  // Process Execution
  btnProcess.addEventListener('click', async () => {
    btnProcess.disabled = true;
    progressBar.parentElement.style.display = 'block';

    const settings = {
      algorithm: document.getElementById('select-algo').value,
      edgeSmoothness: 4,
      alphaThreshold: 180,
    };

    try {
      if (currentFileType === 'image') {
        const img = document.getElementById('media-element');
        processedBlob = await engine.processImage(img, currentROI, settings, (p, msg) => {
          progressBar.style.width = `${p}%`;
          statusText.textContent = msg;
        });
      } else {
        const video = document.getElementById('media-element');
        processedBlob = await engine.processVideoCanvas(video.src, currentROI, settings, (p, msg) => {
          progressBar.style.width = `${p}%`;
          statusText.textContent = msg;
        }, console.log);
      }

      showResult(processedBlob);
    } catch (err) {
      alert('Lỗi xử lý: ' + err.message);
    } finally {
      btnProcess.disabled = false;
    }
  });

  function showResult(blob) {
    const cleanUrl = URL.createObjectURL(blob);
    resultSection.style.display = 'block';

    const afterContainer = document.getElementById('split-after');
    if (currentFileType === 'video') {
      afterContainer.innerHTML = `<video src="${cleanUrl}" controls autoplay loop muted></video>`;
      splitBefore.innerHTML = `<video src="${URL.createObjectURL(currentFile)}" autoplay loop muted></video>`;
    } else {
      afterContainer.innerHTML = `<img src="${cleanUrl}" alt="Cleaned" />`;
      splitBefore.innerHTML = `<img src="${URL.createObjectURL(currentFile)}" alt="Original" />`;
    }

    btnDownload.onclick = () => {
      const a = document.createElement('a');
      a.href = cleanUrl;
      a.download = `cleaned_${currentFile.name}`;
      a.click();
    };
  }

  // Split-screen Slider Dragging
  let isSliding = false;
  splitSlider.addEventListener('mousedown', () => (isSliding = true));
  window.addEventListener('mouseup', () => (isSliding = false));
  window.addEventListener('mousemove', (e) => {
    if (!isSliding) return;
    const rect = splitSlider.getBoundingClientRect();
    const percent = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    splitBefore.style.clipPath = `polygon(0 0, ${percent}% 0, ${percent}% 100%, 0 100%)`;
    splitHandle.style.left = `${percent}%`;
  });
});
