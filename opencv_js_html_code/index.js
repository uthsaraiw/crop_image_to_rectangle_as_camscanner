width = 380;
height = 500;
pad = 5;
let src;
let loaded = false;
let points = [];
const img = new Image();
let mat_image;

// Callback when OpenCV.js is ready
function onOpenCvReady() {
    // Initialize OpenCV.js
    cv.onRuntimeInitialized = function () {
        loaded = true;
    };
}


// Function to handle image processing
function processImage() {

    points = []; // cleaning points list with each process image press

    if (!loaded) {
        console.error('OpenCV.js is not loaded yet.');
        return;
    }
    // Get the input file element
    const fileInput = document.getElementById('fileInput');

    // Check if a file is selected
    if (fileInput.files.length === 0) {
        console.error('No image selected.');
        return;
    }

    // Get the selected file
    const file = fileInput.files[0];

    // Create an HTMLImageElement to display the selected image
    
    img.src = URL.createObjectURL(file);

    img.onload = function () {
        // Get the canvas element
        const canvas = document.getElementById('canvas');

        // Set canvas dimensions to match the image

        canvas.width = width;
        canvas.height = height;

        // Get the 2D drawing context of the canvas
        const ctx = canvas.getContext('2d');

        // Draw the image on the canvas
        ctx.drawImage(img, 0, 0, width, height);       // there is an error in this part should be 380, 554

        // Read the pixel data from the canvas and create a cv.Mat
        const imageData = ctx.getImageData(0, 0, width, height);
        mat_image = new cv.Mat(imageData.height, imageData.width, cv.CV_8UC4);
        mat_image.data.set(imageData.data);

        // Load the image from the canvas using OpenCV.js
        src = cv.imread(canvas);
        let src2 = src.clone();
        cv.cvtColor(src, src, cv.COLOR_RGBA2GRAY, 0);
        cv.threshold(src, src, 130, 255, cv.THRESH_BINARY); //change the threshold here
        //cv.bitwise_not(src, src)

        let contours = new cv.MatVector();
        let hierarchy = new cv.Mat();

        cv.findContours(src, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_NONE);

        

        let contoursArray = [];
        for (let i = 0; i < contours.size(); i++) {
            contoursArray.push(contours.get(i));
        }

        // Sort the contours array by area in descending order
        contoursArray.sort((a, b) => cv.contourArea(b) - cv.contourArea(a));

        // Get the largest contour (first contour after sorting)
        let largestContour = contoursArray[0];
        
        let epsilon = 0.02 * cv.arcLength(largestContour, true);
        let approximatedContour = new cv.Mat();
        cv.approxPolyDP(largestContour, approximatedContour, epsilon, true);
        
        // Extract the four points from the approximated contour
        for (let i = 0; i < 4; i++) { // Use .rows without parentheses
            let point = new cv.Point(approximatedContour.data32S[i * 2], approximatedContour.data32S[i * 2 + 1]);
            points.push(point);
        }
       // console.log(points);

        //function to display the points
        function displayPointsOnClick(src, points) {
  
            let isDragging = false;
            let draggedPointIndex = -1;
          
            //function to draw the points
            function drawPoints() {
              const radius = 10;
              const color = new cv.Scalar(0, 0, 255); // Red color
              const thickness = 3;
              let src_dot = src.clone();
              for (let i = 0; i < points.length; i++) {
                cv.circle(src_dot, points[i], radius, color, -1);
              }
              cv.line(src_dot, points[0], points[1], color, thickness);
              cv.line(src_dot, points[1], points[2], color, thickness);
              cv.line(src_dot, points[2], points[3], color, thickness);
              cv.line(src_dot, points[3], points[0], color, thickness);
              cv.imshow(canvas, src_dot);
              src_dot.delete();

            }
            
          
            drawPoints(); //calling to draw the initial points
          
            // Event listener for mouse click event
            canvas.addEventListener('mousedown', (event) => {
              const mouseX = event.clientX - canvas.getBoundingClientRect().left;
              const mouseY = event.clientY - canvas.getBoundingClientRect().top;
          
              // Check if the click is within a certain radius of any of the points
              const clickRadius = 10; // Adjust as needed
              for (let i = 0; i < points.length; i++) {
                const distance = Math.sqrt(
                  (mouseX - points[i].x) ** 2 + (mouseY - points[i].y) ** 2
                );
                if (distance <= clickRadius) {
                  // The click is within the specified radius of this point
                  isDragging = true;
                  draggedPointIndex = i;
                }
              }
            });
          
            // Event listener for mouse move event
            canvas.addEventListener('mousemove', (event) => {
              if (isDragging && draggedPointIndex !== -1) {
                const mouseX = event.clientX - canvas.getBoundingClientRect().left;
                const mouseY = event.clientY - canvas.getBoundingClientRect().top;
          
                // Update the position of the dragged point
                points[draggedPointIndex].x = mouseX;
                points[draggedPointIndex].y = mouseY;
          
                // Clear the canvas and redraw the updated points
                drawPoints();
              }
            });
          
            // Event listener for mouse up event
            canvas.addEventListener('mouseup', () => {
              if (isDragging) {
                // Print the final drag position
                //console.log(
                //  `Dragged point ${draggedPointIndex}: x=${points[draggedPointIndex].x}, y=${points[draggedPointIndex].y}`
                //);
                isDragging = false;
                draggedPointIndex = -1;
              }
            });
        }
          
        displayPointsOnClick(src2, points);
        src.delete();

    };
}


//main functions to save the image after transformation when button clicked


function saveA4() {

    performPerspectiveTransformation(mat_image, points, width, height, pad);
}

function performPerspectiveTransformation(image, points, w, h, pad) {
    let avg_x = 0;
    let avg_y = 0;
    let max_x = [];
    let max_y = [];

    const values_x = [points[0].x, points[1].x, points[2].x, points[3].x];
    const sum_x = values_x.reduce((acc, value) => acc + value, 0);
    avg_x = sum_x / values_x.length;


    const values_y = [points[0].y, points[1].y, points[2].y, points[3].y];
    const sum_y = values_y.reduce((acc, value) => acc + value, 0);
    avg_y = sum_y / values_y.length;

    for(let i=0; i<4; i++){
      if (points[i].x > avg_x) {
        max_x.push(i);
      }
      if (points[i].y > avg_y) {
        max_y.push(i);
      }
    }

    order = [];
    let srcX1;
    let srcY1;
    let srcX2;
    let srcY2;
    let srcX3;
    let srcY3;
    let srcX4;
    let srcY4;

    for(let i=0; i<4; i++){
      if  (max_x.includes(i) && max_y.includes(i) ) {
        srcX3 = points[i].x;
        srcY3 = points[i].y;
      }else if (max_x.includes(i)){
        srcX4 = points[i].x;
        srcY4 = points[i].y;

      }else if (max_y.includes(i)){
        srcX2 = points[i].x;
        srcY2 = points[i].y;
      }else{
        srcX1 = points[i].x;
        srcY1 = points[i].y;
      }
    }

    const pts1 = new cv.Mat(4, 2, cv.CV_32F);
    pts1.data32F.set([srcX1, srcY1, srcX2, srcY2, srcX3, srcY3, srcX4, srcY4]);

    const pts2 = new cv.Mat(4, 2, cv.CV_32F);
    pts2.data32F.set([0, 0, 0, h, w, h, w, 0]);

    //wrapping the image
    const matrix = cv.getPerspectiveTransform(pts1, pts2);
    const img_wrap = new cv.Mat();
    cv.warpPerspective(image, img_wrap, matrix, new cv.Size(w, h));

    //padding the image
    const height = img_wrap.rows;
    const width = img_wrap.cols;
    const roi = new cv.Rect(pad, pad, width - 2 * pad, height - 2 * pad);
    const img_cropped = new cv.Mat();
    img_wrap.roi(roi).copyTo(img_wrap);

    //resizing the image
    const dstSize = new cv.Size(width, height);
    cv.resize(img_wrap, img_wrap, dstSize);
    display_image(img_wrap);
}


function display_image(imgMat){

    // Get the canvas element 2
    const canvas = document.getElementById('canvas2');
    // Get the 2D drawing context of the canvas
    const ctx = canvas.getContext('2d');

    // Set the canvas dimensions to match the image dimensions
    canvas.width = imgMat.cols;
    canvas.height = imgMat.rows;

    // Create an ImageData object from the Mat's data
    const imgData = new ImageData(new Uint8ClampedArray(imgMat.data), imgMat.cols, imgMat.rows);

    // Put the image data on the canvas
    ctx.putImageData(imgData, 0, 0);

    // Create an HTML Image object
    const img = new Image();
    // Set the Image source to the canvas data URL
    img.src = canvas.toDataURL('image/jpg');

}