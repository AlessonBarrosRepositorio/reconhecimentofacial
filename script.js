const video = document.getElementById('video');

Promise.all([
    faceapi.nets.ssdMobilenetv1.loadFromUri('/models'),
    faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
    faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
])
.then(startWebcam);

function startWebcam(){
    navigator.mediaDevices.getUserMedia({
        'video': true,
        audio: false
    }).then((stream) => {
        video.srcObject = stream;
    }).catch(() => {
        console.log('error');
    });
}

function getLabeledFaceDescriptions(){
    const labels = ['Joao', 'Alesson', 'Marcos', 'Nadya', 'Patrick'];

    return Promise.all(labels.map(async (l) => {

        const descriptions = [];

        for(i=0;i<2;i++){

            const imagem = await faceapi.fetchImage(`./labels/${l}/${i+1}.png`);

            const detections = await faceapi.detectSingleFace(imagem).withFaceLandmarks().withFaceDescriptor();

            descriptions.push(detections.descriptor);
        }

        return new faceapi.LabeledFaceDescriptors(l, descriptions);

    }))
}

video.addEventListener("play", async () => {
    const labeledFaceDescriptors = await getLabeledFaceDescriptions();
    const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors);
  
    const canvas = faceapi.createCanvasFromMedia(video);
    document.body.append(canvas);
  
    const displaySize = { width: video.width, height: video.height };
    faceapi.matchDimensions(canvas, displaySize);
  
    setInterval(async () => {
      const detections = await faceapi
        .detectAllFaces(video)
        .withFaceLandmarks()
        .withFaceDescriptors();
  
      const resizedDetections = faceapi.resizeResults(detections, displaySize);
  
      canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
  
      const results = resizedDetections.map((d) => {
        return faceMatcher.findBestMatch(d.descriptor);
      });
      results.forEach((result, i) => {
        const box = resizedDetections[i].detection.box;
        const drawBox = new faceapi.draw.DrawBox(box, {
          label: result,
        });
        drawBox.draw(canvas);
      });
    }, 100);
});