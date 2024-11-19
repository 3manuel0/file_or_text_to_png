const fileInput = document.getElementById("file");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const textArea = document.getElementById("text");
const showCanvasBtn = document.getElementById("show-canvas");
const showDetailsBtn = document.getElementById("show-details");
const width = 800;
const height = 600;
let pngData;
let fileExt = "";
canvas.width = width;
canvas.height = height;
textArea.style.width = width + "px";
textArea.style.height = height + "px";
textArea.contentEditable = false;

// if file is uploaded
fileInput.addEventListener("change", (event) => {
  // get file from input
  let file = event.target.files[0];

  // get file extension from file name
  let CfileExt = file.name.split(".")[1] + "\0";

  // creat and Uint8array from file ext html => [104, 116, 109, 108, 0]
  let fileExtBytes = Uint8Array.from(
    Array.from(CfileExt).map((char) => char.charCodeAt(0))
  );

  //if file has no extension return
  if (file.name.split(".").length !== 2) {
    console.log("file doesn't might have multiple extensions or . in the name");
    return;
  }
  console.log(fileExt, fileExtBytes);

  // if file not null
  if (file) {
    fileExt = file.name.split(".")[1];

    // extension is .png
    if (fileExt.replaceAll("\0", "") != "png") {
      // new file reader
      let reader = new FileReader();

      // reader loaded successfully
      reader.onload = (e) => {
        result = e.target.result;
        let resultBytes = new Uint8ClampedArray(result);

        /* check if file is bigger than ~ 1.9mb -> 800*600*4
         minus 40bytes for extension and length */
        if (resultBytes.byteLength + 40 > width * height * 4) {
          showText("file is too big you need 1.8mb file", "red");
          console.log(
            "file is too big for supported format",
            resultBytes,
            width * height * 4
          );
          return;
        }
        // create a new uint32 that stores file byte's length
        let dataSize = new Uint32Array([resultBytes.length]);
        // turning them to uint8clamped array
        dataSize = new Uint8ClampedArray(dataSize.buffer);
        console.log(dataSize);
        // calculate the times to duplicate data to fill image
        let length = Math.floor(
          (width * height * 4) / (resultBytes.length + CfileExt.length + 4)
        );
        /* create a uint clamped array to store file bytes + extension 
        + 4 bytes for the data size*/
        let resultBytesWidthExt = new Uint8ClampedArray(
          resultBytes.length + CfileExt.length + 4
        );
        // fill the resultBytesWidthExt with the data
        resultBytesWidthExt.set(fileExtBytes, 0);
        resultBytesWidthExt.set(dataSize, fileExtBytes.length);
        resultBytesWidthExt.set(resultBytes, fileExtBytes.length + 4);
        // TODO remove this :
        let a = Uint8ClampedArray.from(
          new Uint8Array(resultBytesWidthExt.buffer, fileExtBytes.length, 4)
        );
        console.log(new Uint32Array(a.buffer), resultBytes.length);
        console.log(a);
        // code above for debuging getting data size from bytes

        // duplicating data to fill most or all of the image
        let newDtaArr = new Uint8ClampedArray(
          resultBytesWidthExt.length * length
        );
        newDtaArr.set(resultBytesWidthExt, 0);
        for (let i = 0; i < length - 1; i++) {
          newDtaArr.set(
            resultBytesWidthExt,
            resultBytesWidthExt.length + resultBytesWidthExt.length * i
          );
        }

        // console.log(newDtaArr, fileExtBytes);
        // console.log(e.target);

        // create canvas from data to show how image looks like
        createCanvas(newDtaArr);

        // download file when clicking on download button
        document.getElementById("dwn").onclick = () => {
          // Create a Blob and download link
          const blob = new Blob([pngData], { type: "image/png" });
          const url = URL.createObjectURL(blob);
          // Trigger download
          const link = document.createElement("a");
          link.href = url;
          link.download = "output.png";
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        };
      };

      // reader when error
      reader.onerror = (e) => {
        console.log("Error : " + e.type);
      };

      // read file
      reader.readAsArrayBuffer(file);
      // extension is .png
    } else {
      // .png
      let reader = new FileReader();

      // on reader load successfully
      reader.onload = (e) => {
        const result = e.target.result;
        let img = UPNG.decode(result);
        let imageBytes = new Uint8ClampedArray(UPNG.toRGBA8(img)[0]);

        if (imageBytes.byteLength > width * height * 4) {
          showText("file/image is too big for suported format", "red");
          console.log(
            "file/image is too big for suported format",
            imageBytes,
            width * height * 4
          );
          return;
        }

        if (str_len(imageBytes, 0) == 0) {
          showText(
            "you're not using a png that is created using this site",
            "red"
          );
          console.log("you're not using a png that is created using this site");
          return;
        }

        let extLen = str_len(imageBytes, 0) + 1;
        let dataBufferSize = Uint8ClampedArray.from(
          new Uint8ClampedArray(imageBytes.buffer, extLen, 4)
        );
        let extensionString = get_str(0, imageBytes.buffer);
        let fileDataBuffer = new Uint8ClampedArray(
          imageBytes.buffer,
          extLen + 4,
          new Uint32Array(dataBufferSize.buffer)[0]
        );
        console.log(fileDataBuffer);
        console.log(extLen, extensionString);
        // if (extensionString == "txt") {
        let text = new TextDecoder().decode(fileDataBuffer);
        let extTxt = `<p><b>File extension: </b>.${extensionString}</p>`;
        let byteSizeTxt = `<p><b>File byte size: </b>${fileDataBuffer.byteLength}bytes</p>`;
        let content =
          extensionString == "txt"
            ? `</br><span style="background-color: lightblue;padding: 0.1rem;">${text}</span>`
            : "<span> raw file binary data</span>";
        let outputText =
          extTxt + byteSizeTxt + `<p><b>File content:</b>${content}</p>`;
        showText(outputText);
        // } else {
        // TODO draw everything related to the canvas with createCanvas function
        // canvas.style.display = "block";
        // textArea.style.display = "none";
        let imageData = new ImageData(imageBytes, width, height);
        ctx.putImageData(imageData, 0, 0);
        // }

        // Download button onclick
        document.getElementById("dwn").onclick = () => {
          var blob = new Blob([new Uint8Array(fileDataBuffer)]);
          const url = URL.createObjectURL(blob);
          // Trigger download
          const link = document.createElement("a");
          link.href = url;
          link.download = "output." + extensionString;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        };
      };

      // reader when error
      reader.onerror = (e) => {
        console.log("Error : " + e.type);
      };

      // read file
      reader.readAsArrayBuffer(file);
    }
  }
});

const showText = (text, color) => {
  color = color == undefined ? "#000" : color;
  canvas.style.display = "none";
  textArea.style.display = "block";
  textArea.style.color = color;
  textArea.innerHTML = text;
};

const createCanvas = (fileData) => {
  let bytes = new Uint8ClampedArray(width * height * 4);
  console.log(bytes);
  for (let i = 0; i < bytes.length; i++) {
    if (i < fileData.length) {
      // fill empty raw image bytes with file data(it could be duplicated a lot of times)
      bytes[i] = fileData[i];
    } else {
      // filling the rest of the empty bytes with a gary color
      bytes[i] = 50;
    }
  }
  // encode as PNG with UPNG
  pngData = UPNG.encode([bytes.buffer], width, height, 0);
  let imageData = new ImageData(bytes, width, height);
  // textArea.style.display = "none";
  // textArea.value = "";
  canvas.style.display = "block";
  ctx.putImageData(imageData, 0, 0);
};

// get string length from memory
const str_len = (mem, str_ptr) => {
  let len = 0;
  // check if we get to "\0" or 0 byte (Cstring(char*) like style)
  while (mem[str_ptr] != 0) {
    // if we didn't find a 0 byte in all the bytes we return 0;
    if (len >= mem.byteLength) return 0;
    len++;
    str_ptr++;
  }
  return len;
};

// get string from memory
const get_str = (str_ptr, buffer) => {
  const mem = new Uint8Array(buffer);
  const len = str_len(mem, str_ptr);
  // extract string bytes from mmemory buffer
  const str_bytes = new Uint8Array(buffer, str_ptr, len);
  // return string decoded from bytes
  return new TextDecoder().decode(str_bytes);
};

const showCanvas = () => {
  canvas.style.display = "block";
  textArea.style.display = "none";
};
const showDetails = () => {
  canvas.style.display = "none";
  textArea.style.display = "block";
};
showCanvasBtn.onclick = () => showCanvas();
showDetailsBtn.onclick = () => showDetails();
