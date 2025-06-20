// this variable will hold our shader object
let theShader;

// this variable will hold our createGraphics layer
let shaderTexture;

let cam;

let keyColor = [0.058823529411764705, 0.1411764705882353, 0.4];

let colOptions = [
  [1.0, 1.0, 0, 0.5], // yellow
  [1.0, 0, 0.0, 0.5], // magenta
  [1.0, 1.0, 1.0, 0.5], // white
];

let subCol = colOptions[2];

let sliderSimilarity, sliderSmooth;

let sliderSimilarityA, sliderSmoothA;
let sliderSimilarityB, sliderSmoothB;
let sliderSimilarityC, sliderSmoothC;

let simVals = [0, 25, 55];  // 55 // STARTING VALUES A TO C
let smoothVals = [0, 4, 8]; // 8 // STARTING VALUES A TO C


let colOptionIndex = 0;

let displaySliders = false;



let prevMousePos = [0, 0];

/// ML5
let handPose;
let hands = [];

let coordsAreas = [];

let interAreaSize;

let diamFingerCircle;

let actualHeight = 0;
let displayOffset = 0;

const options = {
  maxHands: 1,
  flipped: true,
}

function preload() {
  // Load the handPose model
  handPose = ml5.handPose(options);
}


function setup() {
  // shaders require WEBGL mode to work
  createCanvas(800, 600, WEBGL);

  cam = createCapture(VIDEO, { flipped: true });
  cam.size(width, height);

  cam.hide();

  diamFingerCircle = height / 16;

  interAreaSize = {
    w: width / 4,
    h: height / 8,
    margin: height / 8
  }

  for (let i = 0; i < colOptions.length; i++) {

    thisCoords = {
      w: interAreaSize.w,
      h: interAreaSize.h,

      x: 100,
      y: (interAreaSize.h * i) + interAreaSize.h / 2 + interAreaSize.margin
    }

    console.log(i, thisCoords.x)

    coordsAreas.push(thisCoords);

  }

  angleMode(DEGREES);

  // create a shader object using the vertex shader and fragment shader strings
  theShader = loadShader('basic.vert', 'basic.frag');

  /// sliders color A [0]
  // Create a slider and place it at the top of the canvas.
  sliderSimilarityA = createSlider(0, 100, simVals[0]);
  sliderSimilarityA.position(width, 50);
  sliderSimilarityA.size(80);
  simVals[0] = map(sliderSimilarityA.value(), 0, 255, 0., 0.5);
  sliderSimilarityA.input(setSimilarityA);

  sliderSmoothA = createSlider(0, 20, smoothVals[0]);
  sliderSmoothA.position(width, 80);
  sliderSmoothA.size(80);
  smoothVals[0] = map(sliderSmoothA.value(), 0, 255, 0., 0.5);
  sliderSmoothA.input(setSmoothnessA);

  sliderSimilarityA.hide();
  sliderSmoothA.hide();

    /// sliders color B[1]
  // Create a slider and place it at the top of the canvas.
  sliderSimilarityB = createSlider(0, 100, simVals[1]);
  sliderSimilarityB.position(width, 140);
  sliderSimilarityB.size(80);
  simVals[1] = map(sliderSimilarityB.value(), 0, 255, 0., 0.5);
  sliderSimilarityB.input(setSimilarityB);

  sliderSmoothB = createSlider(0, 20, smoothVals[1]);
  sliderSmoothB.position(width, 170);
  sliderSmoothB.size(80);
  smoothVals[1] = map(sliderSmoothB.value(), 0, 255, 0., 0.5);
  sliderSmoothB.input(setSmoothnessB);

  sliderSimilarityB.hide();
  sliderSmoothB.hide();

      /// sliders color C[2]
  // Create a slider and place it at the top of the canvas.
  sliderSimilarityC = createSlider(0, 100, simVals[2]);
  sliderSimilarityC.position(width, 230);
  sliderSimilarityC.size(80);
  simVals[2] = map(sliderSimilarityC.value(), 0, 255, 0., 0.5);
  sliderSimilarityC.input(setSimilarityC);

  sliderSmoothC = createSlider(0, 20, smoothVals[2]);
  sliderSmoothC.position(width, 260);
  sliderSmoothC.size(80);
  smoothVals[2] = map(sliderSmoothC.value(), 0, 255, 0., 0.5);
  sliderSmoothC.input(setSmoothnessC);

  sliderSimilarityC.hide();
  sliderSmoothC.hide();

  describe('Sphere broken up into a square grid with a gradient in each grid.');

  // start detecting hands from the webcam video
  handPose.detectStart(cam, gotHands);

  noStroke();

  resetSize();
}

function draw() {
  background(255);

  // pixelDensity(1)

  // send uniform values to the shader
  theShader.setUniform('resolution', [width, height]);
  theShader.setUniform('time', millis() / 1000.0);
  theShader.setUniform('tex', cam);
  theShader.setUniform('mouse', [mouseX, map(mouseY, 0, height, height, 0)]);

  // camShader.setUniform('tex', cam);
  theShader.setUniform('texWidth', windowWidth);
  theShader.setUniform('texHeight', windowHeight);

  theShader.setUniform('keyColor', keyColor);
  theShader.setUniform('subColor', subCol);
  theShader.setUniform('similarity', simVals[colOptionIndex]);
  theShader.setUniform('smoothness', smoothVals[colOptionIndex]);

  shader(theShader);
  // add a sphere using the texture
  translate(-0, 0, 0);
  push();
  plane(width, width * .75);
  pop();

  resetShader()

  getFingerPosition()


  drawInterAreas();
}


function getColor() {

  cam.loadPixels();

  const x = mouseX - width / 2;
  const y = mouseY - height / 2;

  prevMousePos = [x, y];

  let index = (mouseX + mouseY * cam.width) * 4;

  // console.log(mouseX,mouseY, cam.width, index);

  let red = cam.pixels[index];
  let green = cam.pixels[index + 1];
  let blue = cam.pixels[index + 2];

  const output = { r: red, g: green, b: blue };

  console.log(output);



  return output;

}

function setKeyColor() {
  const thisColor = getColor();
  console.log('R: ' + thisColor.r + ' - G: ' + thisColor.g + ' - B: ' + thisColor.b);

  const newKeyR = thisColor.r / 255;
  const newKeyG = thisColor.g / 255;
  const newKeyB = thisColor.b / 255;
  console.log('R: ' + newKeyR + ' - G: ' + newKeyG + ' - B: ' + newKeyB);

  keyColor = [newKeyR, newKeyG, newKeyB];
}

function keyPressed() {

  if (key === 's' || key === 'S') {
    displaySliders = !displaySliders;
    if (displaySliders) {
      sliderSimilarityA.show();
      sliderSmoothA.show();
      sliderSimilarityB.show();
      sliderSmoothB.show();
      sliderSimilarityC.show();
      sliderSmoothC.show();
    } else {
      sliderSimilarityA.hide();
      sliderSmoothA.hide();
      sliderSimilarityB.hide();
      sliderSmoothB.hide();
      sliderSimilarityC.hide();
      sliderSmoothC.hide();
    
    }
  }
}

function setSimilarity() {
  simVal = map(sliderSimilarity.value(), 0, 255, 0., 0.5);
  console.log(`Similarity value: ${sliderSimilarity.value()}`);
}

function setSmoothness() {
  smoothVal = map(sliderSmooth.value(), 0, 255, 0., 0.5);
  console.log(`Smoothness value: ${sliderSmooth.value()}`);
}


/// SHAME ON ME
function setSimilarityA() {
  simVals[0] = map(sliderSimilarityA.value(), 0, 255, 0., 0.5);
  console.log(`Similarity A value: ${sliderSimilarityA.value()}`);
}

function setSmoothnessA() {
  smoothVals[0] = map(sliderSmoothA.value(), 0, 255, 0., 0.5);
  console.log(`Smoothness A value: ${sliderSmoothA.value()}`);
}

function setSimilarityB() {
  simVals[1] = map(sliderSimilarityB.value(), 0, 255, 0., 0.5);
  console.log(`Similarity B value: ${sliderSimilarityB.value()}`);
}

function setSmoothnessB() {
  smoothVals[1] = map(sliderSmoothB.value(), 0, 255, 0., 0.5);
  console.log(`Smoothness B value: ${sliderSmoothB.value()}`);
}

function setSimilarityC() {
  simVals[2] = map(sliderSimilarityC.value(), 0, 255, 0., 0.5);
  console.log(`Similarity C value: ${sliderSimilarityC.value()}`);
}

function setSmoothnessC() {
  smoothVals[2] = map(sliderSmoothC.value(), 0, 255, 0., 0.5);
  console.log(`Smoothness C value: ${sliderSmoothC.value()}`);
}





/// ML5

function getFingerPosition() {
  for (let i = 0; i < hands.length; i++) {
    let hand = hands[i];
    let indexKeypoint = hand.keypoints[8];
    let mappedX = map(indexKeypoint.x, 0, cam.width, 0, width);
    let mappedY = map(indexKeypoint.y, 0, cam.height, -displayOffset / 2, height + displayOffset / 2);

    const fingerX = mappedX - width / 2;
    const fingerY = mappedY - height / 2;

    push();
    // fill(0, 255, 255);
    fill(subCol[0]*255,subCol[1]*255, subCol[2]*255 )
    noStroke();
    circle(fingerX, fingerY, diamFingerCircle);
    pop();

    for (let i = 0; i < coordsAreas.length; i++) {
      if (fingerX > coordsAreas[i].x - width / 2 && fingerX < (coordsAreas[i].x - width / 2 + coordsAreas[i].w)
        && fingerY > coordsAreas[i].y - coordsAreas[i].h / 2 - height / 2 && fingerY < (coordsAreas[i].y - height / 2 + coordsAreas[i].h)) {
        subCol = colOptions[i];
        colOptionIndex = i;
      }
    }

  }
}


// Callback function for when handPose outputs data
function gotHands(results) {
  // save the output to the hands variable
  hands = results;
}

function drawInterAreas() {
  for (let i = 0; i < coordsAreas.length; i++) {

    push();
    fill(colOptions[i][0] * 255, colOptions[i][1] * 255, colOptions[i][2] * 255, colOptions[i][3] * 255);
    translate(coordsAreas[i].x + interAreaSize.w / 2 - width / 2, coordsAreas[i].y - height / 2);
    plane(interAreaSize.w, interAreaSize.h);
    pop();
  }

}

function resetSize() {
  resizeCanvas(windowWidth, windowHeight);
  actualHeight = windowWidth * 0.75;
  displayOffset = actualHeight - windowHeight

  interAreaSize = {
    w: width / 4,
    h: height / 8,
    margin: height / 8
  }

  for (let i = 0; i < coordsAreas.length; i++) {
    coordsAreas[i].w = interAreaSize.w;
    coordsAreas[i].h = interAreaSize.h;

    coordsAreas[i].x = 100;
    coordsAreas[i].y = (interAreaSize.h * i) + interAreaSize.h / 2 + interAreaSize.margin;
  }

}

function windowResized() {
  resetSize();
}


